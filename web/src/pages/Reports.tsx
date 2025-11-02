import React, { useState, useMemo } from 'react';
import type { Board, Card } from '../Types';
import { useLanguage } from '../i18n/useLanguage';

interface ReportsProps {
  boards: Board[];
}

const Reports: React.FC<ReportsProps> = ({ boards }) => {
  const { t } = useLanguage();
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [reportType, setReportType] = useState<'overview' | 'productivity' | 'burndown' | 'velocity' | 'time' | 'team' | 'custom'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  // Removed unused selectedPeriod state

  // Calculate productivity metrics
  const productivityMetrics = useMemo(() => {
    // Get all cards from selected board(s)
    const getAllCards = (): Card[] => {
      let allCards: Card[] = [];
      
      if (selectedBoard === 'all') {
        boards.forEach(board => {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        });
      } else {
        const board = boards.find(b => b.id === selectedBoard);
        if (board) {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        }
      }

      return allCards;
    };

    // Filter cards by date range
    const getCardsInDateRange = (cards: Card[]) => {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return cards.filter(card => {
        const cardDate = card.dueDate ? new Date(card.dueDate) : 
                        card.startDate ? new Date(card.startDate) : null;
        
        if (!cardDate) return false;
        
        return cardDate >= startDate && cardDate <= endDate;
      });
    };

    const allCards = getAllCards();
    const cardsInRange = getCardsInDateRange(allCards);
    
    const totalTasks = cardsInRange.length;
    const completedTasks = cardsInRange.filter(card => {
      // Check if task is in "Done" column or has all subtasks completed
      const board = boards.find(b => b.columns.some(col => col.cards.some(c => c.id === card.id)));
      const column = board?.columns.find(col => col.cards.some(c => c.id === card.id));
      const isDoneColumn = column?.title.toLowerCase().includes('done') || 
                          column?.title.toLowerCase().includes('مكتمل') ||
                          column?.title.toLowerCase().includes('completed');
      
      const allSubtasksCompleted = card.subtasks.length > 0 && 
                                  card.subtasks.every(subtask => subtask.done);
      
      return isDoneColumn || allSubtasksCompleted;
    }).length;
    
    const overdueTasks = cardsInRange.filter(card => {
      if (!card.dueDate) return false;
      return new Date(card.dueDate) < new Date() && 
             !boards.find(b => b.columns.some(col => 
               col.cards.some(c => c.id === card.id) && 
               col.title.toLowerCase().includes('done')
             ));
    }).length;
    
    const totalTimeSpent = cardsInRange.reduce((total, card) => {
      return total + (card.timeEntries?.reduce((cardTotal, entry) => cardTotal + entry.duration, 0) || 0);
    }, 0);
    
    const avgTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks : 0;
    
    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
      avgTimePerTask: Math.round(avgTimePerTask / 60) // Convert to hours
    };
  }, [boards, selectedBoard, dateRange]);

  // Calculate burndown data
  const burndownData = useMemo(() => {
    // Get all cards from selected board(s)
    const getAllCards = (): Card[] => {
      let allCards: Card[] = [];
      
      if (selectedBoard === 'all') {
        boards.forEach(board => {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        });
      } else {
        const board = boards.find(b => b.id === selectedBoard);
        if (board) {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        }
      }

      return allCards;
    };

    // Filter cards by date range
    const getCardsInDateRange = (cards: Card[]) => {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return cards.filter(card => {
        const cardDate = card.dueDate ? new Date(card.dueDate) : 
                        card.startDate ? new Date(card.startDate) : null;
        
        if (!cardDate) return false;
        
        return cardDate >= startDate && cardDate <= endDate;
      });
    };

    const allCards = getAllCards();
    const cardsInRange = getCardsInDateRange(allCards);
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const data = [];
    const totalTasks = cardsInRange.length;
    
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const completedByDate = cardsInRange.filter(card => {
        // Simplified: assume task completed if it has activity on or before this date
        const lastActivity = card.activity.length > 0 ? 
          Math.max(...card.activity.map(a => a.at)) : 0;
        return lastActivity <= currentDate.getTime();
      }).length;
      
      const remaining = totalTasks - completedByDate;
      const ideal = totalTasks - (totalTasks * (i / totalDays));
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        remaining,
        ideal: Math.max(0, Math.round(ideal))
      });
    }
    
    return data;
  }, [boards, selectedBoard, dateRange]);

  // Calculate velocity data
  const velocityData = useMemo(() => {
    // Get all cards from selected board(s)
    const getAllCards = (): Card[] => {
      let allCards: Card[] = [];
      
      if (selectedBoard === 'all') {
        boards.forEach(board => {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        });
      } else {
        const board = boards.find(b => b.id === selectedBoard);
        if (board) {
          board.columns.forEach(column => {
            allCards = [...allCards, ...column.cards];
          });
        }
      }

      return allCards;
    };

    const allCards = getAllCards();
    const weeks = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Group by weeks
    const currentWeek = new Date(startDate);
    while (currentWeek <= endDate) {
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekCards = allCards.filter(card => {
        const cardDate = card.dueDate ? new Date(card.dueDate) : 
                        card.startDate ? new Date(card.startDate) : null;
        return cardDate && cardDate >= currentWeek && cardDate <= weekEnd;
      });
      
      const completed = weekCards.filter(card => {
        const board = boards.find(b => b.columns.some(col => col.cards.some(c => c.id === card.id)));
        const column = board?.columns.find(col => col.cards.some(c => c.id === card.id));
        return column?.title.toLowerCase().includes('done') || 
               column?.title.toLowerCase().includes('مكتمل');
      }).length;
      
      weeks.push({
        week: `${currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        planned: weekCards.length,
        completed
      });
      
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    return weeks;
  }, [boards, selectedBoard, dateRange]);

  // Export report data
  const exportReport = (format: 'json' | 'csv' | 'pdf' | 'word') => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const boardName = selectedBoard === 'all' ? 'جميع اللوحات' : 
        boards.find(b => b.id === selectedBoard)?.title || 'غير محدد';

      if (format === 'json') {
        const data = {
          reportType,
          dateRange,
          selectedBoard: boardName,
          productivity: productivityMetrics,
          burndown: burndownData,
          velocity: velocityData,
          generatedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-${reportType}-${currentDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'csv') {
        let csvContent = '';
        
        if (reportType === 'productivity') {
          csvContent = [
            ['المقياس', 'القيمة'],
            ['إجمالي المهام', productivityMetrics.totalTasks.toString()],
            ['المهام المكتملة', productivityMetrics.completedTasks.toString()],
            ['المهام المتأخرة', productivityMetrics.overdueTasks.toString()],
            ['معدل الإنجاز', `${productivityMetrics.completionRate.toFixed(1)}%`],
            ['إجمالي الوقت', `${productivityMetrics.totalTimeSpent} ساعة`],
            ['متوسط الوقت لكل مهمة', `${productivityMetrics.avgTimePerTask} ساعة`]
          ].map(row => row.join(',')).join('\n');
        } else if (reportType === 'velocity') {
          csvContent = [
            ['الأسبوع', 'المخطط', 'المكتمل'],
            ...velocityData.map(week => [week.week, week.planned.toString(), week.completed.toString()])
          ].map(row => row.join(',')).join('\n');
        } else if (reportType === 'burndown') {
          csvContent = [
            ['التاريخ', 'المتبقي', 'المثالي'],
            ...burndownData.map(point => [point.date, point.remaining.toString(), point.ideal.toString()])
          ].map(row => row.join(',')).join('\n');
        }
        
        const blob = new Blob(['\ufeff' + csvContent], { 
          type: 'text/csv;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-${reportType}-${currentDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'pdf') {
        // Create HTML content for PDF-like display
        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير ${reportType}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            direction: rtl; 
            margin: 20px;
            background: white;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #2c3e50; 
            margin-bottom: 10px;
        }
        .metric { 
            margin: 15px 0; 
            padding: 15px; 
            background-color: #f8f9fa; 
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        .section { 
            margin: 30px 0; 
        }
        .section h2 {
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .chart-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        .chart-table th, .chart-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: center; 
        }
        .chart-table th { 
            background-color: #4CAF50; 
            color: white; 
        }
        .chart-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 تقرير ${reportType}</h1>
        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        <p><strong>اللوحة:</strong> ${boardName}</p>
        <p><strong>الفترة:</strong> ${dateRange.start} إلى ${dateRange.end}</p>
    </div>

    ${reportType === 'productivity' ? `
    <div class="section">
        <h2>📈 مقاييس الإنتاجية</h2>
        <div class="metric"><strong>إجمالي المهام:</strong> ${productivityMetrics.totalTasks}</div>
        <div class="metric"><strong>المهام المكتملة:</strong> ${productivityMetrics.completedTasks}</div>
        <div class="metric"><strong>المهام المتأخرة:</strong> ${productivityMetrics.overdueTasks}</div>
        <div class="metric"><strong>معدل الإنجاز:</strong> ${productivityMetrics.completionRate.toFixed(1)}%</div>
        <div class="metric"><strong>إجمالي الوقت:</strong> ${productivityMetrics.totalTimeSpent} ساعة</div>
        <div class="metric"><strong>متوسط الوقت لكل مهمة:</strong> ${productivityMetrics.avgTimePerTask} ساعة</div>
    </div>
    ` : ''}

    ${reportType === 'velocity' ? `
    <div class="section">
        <h2>🚀 تقرير السرعة</h2>
        <table class="chart-table">
            <tr>
                <th>الأسبوع</th>
                <th>المخطط</th>
                <th>المكتمل</th>
                <th>معدل الإنجاز</th>
            </tr>
            ${velocityData.map(week => `
            <tr>
                <td>${week.week}</td>
                <td>${week.planned}</td>
                <td>${week.completed}</td>
                <td>${week.planned > 0 ? ((week.completed / week.planned) * 100).toFixed(1) : 0}%</td>
            </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

    ${reportType === 'burndown' ? `
    <div class="section">
        <h2>📉 مخطط الإنجاز</h2>
        <table class="chart-table">
            <tr>
                <th>التاريخ</th>
                <th>المهام المتبقية</th>
                <th>المثالي</th>
            </tr>
            ${burndownData.slice(0, 10).map(point => `
            <tr>
                <td>${new Date(point.date).toLocaleDateString('ar-SA')}</td>
                <td>${point.remaining}</td>
                <td>${point.ideal}</td>
            </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة ToDoOS - نظام إدارة المشاريع المتقدم</p>
        <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}</p>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">طباعة التقرير</button>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-${reportType}-${currentDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'word') {
        // Generate Word document content
        const wordContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>تقرير ${reportType}</title>
<style>
body { font-family: Arial, sans-serif; direction: rtl; }
.header { text-align: center; margin-bottom: 30px; }
.metric { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
.section { margin: 20px 0; }
.chart-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.chart-table th, .chart-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
.chart-table th { background-color: #4CAF50; color: white; }
</style>
</head>
<body>

<div class="header">
<h1>📊 تقرير ${reportType}</h1>
<p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
<p><strong>اللوحة:</strong> ${boardName}</p>
<p><strong>الفترة:</strong> ${dateRange.start} إلى ${dateRange.end}</p>
</div>

${reportType === 'productivity' ? `
<div class="section">
<h2>📈 مقاييس الإنتاجية</h2>
<div class="metric"><strong>إجمالي المهام:</strong> ${productivityMetrics.totalTasks}</div>
<div class="metric"><strong>المهام المكتملة:</strong> ${productivityMetrics.completedTasks}</div>
<div class="metric"><strong>المهام المتأخرة:</strong> ${productivityMetrics.overdueTasks}</div>
<div class="metric"><strong>معدل الإنجاز:</strong> ${productivityMetrics.completionRate.toFixed(1)}%</div>
<div class="metric"><strong>إجمالي الوقت:</strong> ${productivityMetrics.totalTimeSpent} ساعة</div>
<div class="metric"><strong>متوسط الوقت لكل مهمة:</strong> ${productivityMetrics.avgTimePerTask} ساعة</div>
</div>
` : ''}

<div class="section">
<p style="text-align: center; color: #666; font-size: 12px;">
تم إنشاء هذا التقرير بواسطة ToDoOS - نظام إدارة المشاريع المتقدم
</p>
</div>

</body>
</html>`;

        const blob = new Blob([wordContent], { 
          type: 'application/msword;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-${reportType}-${currentDate}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Show success message
      alert(`تم تصدير التقرير بنجاح بصيغة ${format.toUpperCase()}!`);

    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء تصدير التقرير. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📊 {t.reports}
            </h1>
            
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('json')}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                📄 JSON
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
              >
                📊 CSV
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
              >
                📑 PDF
              </button>
              <button
                onClick={() => exportReport('word')}
                className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm"
              >
                📝 Word
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'overview' | 'productivity' | 'burndown' | 'velocity' | 'time' | 'team' | 'custom')}
                className="w-full border rounded px-3 py-2"
              >
                <option value="productivity">{t.productivity}</option>
                <option value="burndown">{t.burndown}</option>
                <option value="velocity">{t.velocity}</option>
                <option value="custom">{t.customReport}</option>
              </select>
            </div>

            {/* Board Selector */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.board}</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="all">All Boards</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {reportType === 'productivity' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t.productivity} Report</h2>
              
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{productivityMetrics.totalTasks}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{productivityMetrics.completedTasks}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{productivityMetrics.overdueTasks}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{productivityMetrics.completionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{productivityMetrics.totalTimeSpent}h</div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{productivityMetrics.avgTimePerTask}h</div>
                  <div className="text-sm text-gray-600">Avg per Task</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="font-medium mb-4">Completion Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${productivityMetrics.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0%</span>
                  <span>{productivityMetrics.completionRate.toFixed(1)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'burndown' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t.burndown} Chart</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="h-64 flex items-end justify-between gap-2">
                  {burndownData.slice(0, 10).map((point, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="flex gap-1 mb-2">
                        <div 
                          className="w-4 bg-blue-500 rounded-t"
                          style={{ height: `${(point.remaining / Math.max(...burndownData.map(p => p.remaining))) * 200}px` }}
                          title={`Remaining: ${point.remaining}`}
                        />
                        <div 
                          className="w-4 bg-gray-400 rounded-t"
                          style={{ height: `${(point.ideal / Math.max(...burndownData.map(p => p.ideal))) * 200}px` }}
                          title={`Ideal: ${point.ideal}`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 transform -rotate-45 origin-top-left">
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Actual Remaining</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span className="text-sm">Ideal Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'velocity' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t.velocity} Report</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="h-64 flex items-end justify-between gap-2">
                  {velocityData.map((week, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="flex gap-1 mb-2">
                        <div 
                          className="w-6 bg-blue-500 rounded-t"
                          style={{ height: `${(week.planned / Math.max(...velocityData.map(w => Math.max(w.planned, w.completed)))) * 200}px` }}
                          title={`Planned: ${week.planned}`}
                        />
                        <div 
                          className="w-6 bg-green-500 rounded-t"
                          style={{ height: `${(week.completed / Math.max(...velocityData.map(w => Math.max(w.planned, w.completed)))) * 200}px` }}
                          title={`Completed: ${week.completed}`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        {week.week}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Planned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'custom' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t.customReport}</h2>
              
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🔧</div>
                <p>Custom report builder coming soon!</p>
                <p className="text-sm">This feature will allow you to create custom reports with specific metrics and visualizations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
