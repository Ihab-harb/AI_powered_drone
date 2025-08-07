import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface BudgetData {
  expectedCost?: number;
  actualCost?: number;
  maintenanceBudget?: number;
  modificationBudget?: number;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor(private firestore: Firestore) {}

  async generateDroneReport(drone: any): Promise<void> {
    const pdf = new jsPDF();
    const budgetData = this.extractBudgetData(drone);
    
    this.addTitle(pdf, drone);
    
    const startY = drone.imageBase64 ? 85 : 40;
    let currentY = this.addDroneTable(pdf, drone, startY);
    
    currentY = this.addBudgetTables(pdf, budgetData, currentY);
    currentY = this.addVisualizations(pdf, budgetData, currentY);
    
    if (budgetData.notes) {
      currentY = this.addNotes(pdf, budgetData.notes, currentY);
    }
    
    this.addFooter(pdf);
    pdf.save(`Drone_Report_${drone.name?.replace(/\s+/g, '_') || 'unnamed'}.pdf`);
  }

  private extractBudgetData(drone: any): BudgetData {
    if (!drone.budget) {
      return {
        expectedCost: 0,
        actualCost: 0,
        maintenanceBudget: 0,
        modificationBudget: 0,
        estimatedHours: 0,
        actualHours: 0,
        notes: null
      };
    }
    
    return {
      expectedCost: drone.budget.expectedCost || 0,
      actualCost: drone.budget.actualCost || 0,
      maintenanceBudget: drone.budget.maintenanceBudget || 0,
      modificationBudget: drone.budget.modificationBudget || 0,
      estimatedHours: drone.budget.estimatedHours || 0,
      actualHours: drone.budget.actualHours || 0,
      notes: drone.budget.notes || null
    };
  }

  private addTitle(pdf: jsPDF, drone: any) {
    pdf.setFillColor(63, 81, 181);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 30, 'F');
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Drone Report: ${drone.name || 'Unnamed'}`, 105, 20, { align: 'center' });
    
    if (drone.imageBase64) {
      try {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(75, 35, 60, 45, 3, 3, 'S');
        pdf.addImage(drone.imageBase64, 'JPEG', 80, 40, 50, 35);
      } catch (e) {
        console.error('Image error:', e);
      }
    }
  }

  private addDroneTable(pdf: jsPDF, drone: any, startY: number): number {
    autoTable(pdf, {
      startY: startY,
      head: [['Specification', 'Value']],
      body: [
        ['Category', drone.category || 'N/A'],
        ['Model', drone.model || 'N/A'],
        ['Battery', `${drone.batteryCapacity || 0} mAh`],
        ['Weight', `${drone.weight || 0} g`],
        ['Max Flight Time', `${drone.maxFlightTime || 0} min`],
        ['Status', drone.status || 'N/A'],
        ['Last Maintenance', drone.lastMaintenance || 'N/A']
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: [63, 81, 181],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    return (pdf as any).lastAutoTable.finalY;
  }

  private addBudgetTables(pdf: jsPDF, data: BudgetData, startY: number): number {
    autoTable(pdf, {
      startY: startY + 15,
      head: [['Budget Type', 'Amount']],
      body: [
        ['Expected Budget', this.formatCurrency(data.expectedCost)],
        ['Actual Cost', this.formatCurrency(data.actualCost)],
        ['Variance', this.formatCurrency((data.expectedCost || 0) - (data.actualCost || 0))],
        ['Maintenance Budget', this.formatCurrency(data.maintenanceBudget)],
        ['Modification Budget', this.formatCurrency(data.modificationBudget)]
      ],
      columnStyles: {
        1: { halign: 'right' }
      },
      headStyles: { 
        fillColor: [63, 81, 181],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 10,
      head: [['Time Tracking', 'Hours']],
      body: [
        ['Estimated Hours', data.estimatedHours || 0],
        ['Actual Hours', data.actualHours || 0],
        ['Variance', (data.estimatedHours || 0) - (data.actualHours || 0)]
      ],
      headStyles: { 
        fillColor: [63, 81, 181],
        textColor: 255,
        fontStyle: 'bold'
      }
    });
    return (pdf as any).lastAutoTable.finalY;
  }

  private addVisualizations(pdf: jsPDF, data: BudgetData, startY: number): number {
    let currentY = startY + 25;
    
    if (currentY + 150 > pdf.internal.pageSize.height) {
      pdf.addPage();
      currentY = 30;
    }
    
    currentY = this.createBudgetComparisonChart(pdf, data, currentY) + 20;
    return currentY;
  }

  private createBudgetComparisonChart(pdf: jsPDF, data: BudgetData, yPos: number): number {
    const maxValue = Math.max(data.expectedCost || 0, data.actualCost || 0, 1);
    const chartHeight = 80;
    const chartWidth = 150;
    const startX = (pdf.internal.pageSize.width - chartWidth) / 2;
    
    pdf.setFontSize(14);
    pdf.setTextColor(63, 81, 181);
    pdf.text('Budget Comparison', pdf.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    pdf.setDrawColor(220, 220, 220);
    pdf.roundedRect(startX - 5, yPos + 10, chartWidth + 10, chartHeight + 30, 3, 3, 'S');
    
    const items = [
      { label: 'Expected', value: data.expectedCost || 0, color: [76, 175, 80] },
      { label: 'Actual', value: data.actualCost || 0, color: [33, 150, 243] }
    ];
    
    pdf.setDrawColor(100, 100, 100);
    pdf.line(startX, yPos + 15, startX, yPos + 15 + chartHeight);
    
    pdf.setFontSize(9);
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * i;
      const y = yPos + 15 + chartHeight - (i * (chartHeight / 5));
      pdf.text(this.formatCurrency(value), startX - 15, y);
      pdf.line(startX - 3, y, startX, y);
    }
    
    const barWidth = 40;
    const gap = 30;
    
    items.forEach((item, i) => {
      const x = startX + 20 + (i * (barWidth + gap));
      const barHeight = (item.value / maxValue) * chartHeight;
      
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(x, yPos + 15 + chartHeight - barHeight, barWidth, barHeight, 2, 2, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(this.formatCurrency(item.value), x + barWidth/2, yPos + 15 + chartHeight - barHeight - 5, { align: 'center' });
      
      pdf.text(item.label, x + barWidth/2, yPos + 15 + chartHeight + 15, { align: 'center' });
    });
    
    pdf.setDrawColor(100, 100, 100);
    pdf.line(startX, yPos + 15 + chartHeight, startX + chartWidth, yPos + 15 + chartHeight);
    
    return yPos + chartHeight + 50;
  }

  private addNotes(pdf: jsPDF, notes: string, startY: number): number {
    let currentY = startY;
    
    if (currentY + 60 > pdf.internal.pageSize.height) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setTextColor(63, 81, 181);
    pdf.text('Notes:', 20, currentY);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.roundedRect(20, currentY + 5, 170, 40, 3, 3, 'S');
    
    const lines = pdf.splitTextToSize(notes, 165);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(lines, 25, currentY + 10);
    
    return currentY + 50;
  }

  private addFooter(pdf: jsPDF) {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 285, 190, 285);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290);
      pdf.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
    }
  }

  private formatCurrency(value?: number): string {
    return `$${this.formatNumber(value || 0)}`;
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private createPieSlice(cx: number, cy: number, r: number, start: number, end: number): any[] {
    return [
      ['M', cx, cy],
      ['L', cx + r * Math.cos(start), cy + r * Math.sin(start)],
      ['A', r, r, 0, end - start > Math.PI ? 1 : 0, 1, cx + r * Math.cos(end), cy + r * Math.sin(end)],
      ['L', cx, cy],
      ['Z']
    ];
  }

  private async getBudgetData(droneId: string): Promise<BudgetData> {
    const docRef = doc(this.firestore, `drones/${droneId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        expectedCost: data['expectedCost'] || 0,
        actualCost: data['actualCost'] || 0,
        maintenanceBudget: data['maintenanceBudget'] || 0,
        modificationBudget: data['modificationBudget'] || 0,
        estimatedHours: data['estimatedHours'] || 0,
        actualHours: data['actualHours'] || 0,
        notes: data['notes'] || null
      };
    }
    
    return {
      expectedCost: 0,
      actualCost: 0,
      maintenanceBudget: 0,
      modificationBudget: 0,
      estimatedHours: 0,
      actualHours: 0,
      notes: null
    };
  }
}