import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Firestore, collection, query, where, onSnapshot } from '@angular/fire/firestore';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flightTimeChart', { static: false }) flightTimeChartRef!: ElementRef<HTMLCanvasElement>;
  
  private statusChart?: Chart;
  private categoryChart?: Chart;
  private flightTimeChart?: Chart;
  
  isLoading: boolean = true;
  statusOptions = ['active', 'maintenance', 'retired', 'lost', 'damaged'];
  statusColors = ['#48BB78', '#F6AD55', '#E53E3E', '#718096', '#805AD5'];
  droneCategories = [
    'Race drone',
    'People detection drone',
    'Flower detection drone',
    'Fun drone',
    'Others'
  ];

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadDroneData();
  }

  ngOnDestroy() {
    [this.statusChart, this.categoryChart, this.flightTimeChart].forEach(chart => {
      if (chart) chart.destroy();
    });
  }

  loadDroneData() {
    const dronesCollection = collection(this.firestore, 'drones');
    const q = query(dronesCollection, where('isDeleted', '==', false));
    
    onSnapshot(q, (snapshot) => {
      const drones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      
      this.createStatusChart(drones);
      this.createCategoryChart(drones);
      this.createFlightTimeChart(drones);
      this.isLoading = false;
    });
  }

  createStatusChart(drones: any[]) {
    if (!this.statusChartRef?.nativeElement) {
      setTimeout(() => this.createStatusChart(drones), 100);
      return;
    }

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const statusCounts: number[] = this.statusOptions.map(status => 
      drones.filter(d => d.status === status).length
    );

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: this.statusOptions.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [{
          data: statusCounts,
          backgroundColor: this.statusColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.statusChart = new Chart(this.statusChartRef.nativeElement, config);
  }

  createCategoryChart(drones: any[]) {
    if (!this.categoryChartRef?.nativeElement) {
      setTimeout(() => this.createCategoryChart(drones), 100);
      return;
    }

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const categoryCounts = this.droneCategories.map(category => 
      drones.filter(d => d.category === category).length
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.droneCategories.map(c => c.split(' ')[0]),
        datasets: [{
          label: 'Number of Drones',
          data: categoryCounts,
          backgroundColor: '#4299e1',
          borderColor: '#1a365d',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        }
      }
    };

    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, config);
  }

  createFlightTimeChart(drones: any[]) {
    if (!this.flightTimeChartRef?.nativeElement) {
      setTimeout(() => this.createFlightTimeChart(drones), 100);
      return;
    }

    if (this.flightTimeChart) {
      this.flightTimeChart.destroy();
    }

    // Show all non-deleted drones (isDeleted filter already applied in loadDroneData)
    const sortedDrones = [...drones].sort((a, b) => 
      this.calculateFlightTime(b) - this.calculateFlightTime(a)
    ).slice(0, 10);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: sortedDrones.map(d => d.name),
        datasets: [{
          label: 'Flight Time (min)',
          data: sortedDrones.map(d => this.calculateFlightTime(d)),
          backgroundColor: '#48bb78',
          borderColor: '#2f855a',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const drone = sortedDrones[context.dataIndex];
                return `Status: ${drone.status}\nBattery: ${drone.batteryCapacity}mAh\nVoltage: ${drone.batteryVoltage || 3.7}V\nWeight: ${drone.weight}g`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Minutes'
            }
          }
        }
      }
    };

    this.flightTimeChart = new Chart(this.flightTimeChartRef.nativeElement, config);
  }

  calculateFlightTime(drone: any): number {
    if (!drone.batteryCapacity || !drone.weight) return 0;
    const voltage = drone.batteryVoltage || 3.7;
    const capacityAh = drone.batteryCapacity / 1000;
    const energyWh = capacityAh * voltage;
    const weightKg = drone.weight / 1000;
    const powerW = 100 * weightKg + 50;
    const efficiency = 0.85;
    const flightTimeHours = (energyWh * efficiency) / powerW;
    return Math.max(1, Math.round(flightTimeHours * 60));
  }
}