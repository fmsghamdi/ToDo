import React, { useState, useMemo } from 'react';
import type { Board, Card } from '../Types';
import { useLanguage } from '../i18n/useLanguage';

interface AdvancedReportsProps {
  boards: Board[];
}

const AdvancedReports: React.FC<AdvancedReportsProps> = ({ boards }) => {
  const { t } = useLanguage();
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [reportType, setReportType] = useState<'overview' | 'productivity' | 'burndown' | 'velocity' | 'time' | 'team' | 'custom'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // Quick period selector
  const handlePeriodChange = (period: '7d' | '30d' | '90d' | 'custom') => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const end = new Date();
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });
    }
  };

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

  // Advanced metrics calculation
  const advancedMetrics = useMemo(() => {
    const allCards = getAllCards();

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const cardsInRange = allCards.filter(card => {
      const cardDate = card.dueDate ? new Date(card.dueDate) : 
                      card.startDate ? new Date(card.startDate) : 
                      card.activity.length > 0 ? new Date(card.activity[0].at) : null;
      
      if (!cardDate) return false;
      return cardDate >= startDate && cardDate <= endDate;
    });

    const completedTasks = cardsInRange.filter(card => {
      const board = boards.find(b => b.columns.some(col => col.cards.some(c => c.id === card.id)));
      const column = board?.columns.find(col => col.cards.some(c => c.id === card.id));
      return column?.title.toLowerCase().includes('done') || 
             column?.title.toLowerCase().includes('مكتمل') ||
             column?.title.toLowerCase().includes('completed');
    });

    const overdueTasks = cardsInRange.filter(card => {
      if (!card.dueDate) return false;
      const board = boards.find(b => b.columns.some(col => col.cards.some(c => c.id === card.id)));
      const column = board?.columns.find(col => col.cards.some(c => c.id === card.id));
      const isDone = column?.title.toLowerCase().includes('done');
      return new Date(card.dueDate) < new Date() && !isDone;
    });

    const totalTimeSpent = cardsInRange.reduce((total, card) => {
      return total + (card.timeEntries?.reduce((cardTotal, entry) => cardTotal + entry.duration, 0) || 0);
    }, 0);

    const highPriorityTasks = cardsInRange.filter(card => card.priority === 'High');
    const mediumPriorityTasks = cardsInRange.filter(card => card.priority === 'Medium');
    const lowPriorityTasks = cardsInRange.filter(card => card.priority === 'Low');

    // Team performance
    const teamPerformance = new Map<string, { completed: number; total: number; timeSpent: number }>();
    cardsInRange.forEach(card => {
      card.members.forEach(member => {
        const current = teamPerformance.get(member.id) || { completed: 0, total: 0, timeSpent: 0 };
        const isCompleted = completedTasks.some(c => c.id === card.id);
        const timeSpent = card.timeEntries?.filter(entry => entry.userId === member.id)
          .reduce((total, entry) => total + entry.duration, 0) || 0;
        
        teamPerformance.set(member.id, {
          completed: current.completed + (isCompleted ? 1 : 0),
          total: current.total + 1,
          timeSpent: current.timeSpent + timeSpent
        });
      });
    });

    return {
      totalTasks: cardsInRange.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      inProgressTasks: cardsInRange.length - completedTasks.length - overdueTasks.length,
      completionRate: cardsInRange.length > 0 ? (completedTasks.length / cardsInRange.length) * 100 : 0,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
      avgTimePerTask: cardsInRange.length > 0 ? Math.round(totalTimeSpent / cardsInRange.length / 60) : 0,
      highPriorityTasks: highPriorityTasks.length,
      mediumPriorityTasks: mediumPriorityTasks.length,
      lowPriorityTasks: lowPriorityTasks.length,
      teamPerformance: Array.from(teamPerformance.entries()).map(([memberId, stats]) => {
        const member = allCards.flatMap(c => c.members).find(m => m.id === memberId);
        return {
          member: member || { id: memberId, name: 'Unknown', avatar: '👤' },
          ...stats,
          completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          avgTimePerTask: stats.total > 0 ? Math.round(stats.timeSpent / stats.total / 60) : 0
        };
      }).sort((a, b) => b.completionRate - a.completionRate)
    };
  }, [boards, selectedBoard, dateRange, getAllCards]);

  // Daily progress data for charts
  const dailyProgressData = useMemo(() => {
    const allCards = getAllCards();

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const data = [];
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const tasksCreated = allCards.filter(card => {
        const createdDate = new Date(card.activity[0]?.at || 0);
        return createdDate.toDateString() === currentDate.toDateString();
      }).length;
      
      const tasksCompleted = allCards.filter(card => {
        const completedActivity = card.activity.find(a => a.type === 'moved' && a.message.includes('Done'));
        if (!completedActivity) return false;
        const completedDate = new Date(completedActivity.at);
        return completedDate.toDateString() === currentDate.toDateString();
      }).length;
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        created: tasksCreated,
        completed: tasksCompleted,
        dateLabel: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  }, [boards, selectedBoard, dateRange]);

  // Generate Word document content
  const generateWordContent = () => {
    const currentDate = new Date().toLocaleDateString('ar-SA');
    const boardName = selectedBoard === 'all' ? 'جميع اللوحات' : 
      boards.find(b => b.id === selectedBoard)?.title || 'غير محدد';
    
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>تقرير المشروع المتقدم</title>
<style>
body { font-family: Arial, sans-serif; direction: rtl; }
.header { text-align: center; margin-bottom: 30px; }
.metric { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
.section { margin: 20px 0; }
.team-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.team-table th, .team-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
.team-table th { background-color: #4CAF50; color: white; }
</style>
</head>
<body>

<div class="header">
<h1>📊 تقرير المشروع المتقدم</h1>
<p><strong>التاريخ:</strong> ${currentDate}</p>
<p><strong>اللوحة:</strong> ${boardName}</p>
<p><strong>الفترة:</strong> ${dateRange.start} إلى ${dateRange.end}</p>
</div>

<div class="section">
<h2>📈 الإحصائيات الرئيسية</h2>
<div class="metric"><strong>إجمالي المهام:</strong> ${advancedMetrics.totalTasks}</div>
<div class="metric"><strong>المهام المكتملة:</strong> ${advancedMetrics.completedTasks}</div>
<div class="metric"><strong>المهام المتأخرة:</strong> ${advancedMetrics.overdueTasks}</div>
<div class="metric"><strong>معدل الإنجاز:</strong> ${advancedMetrics.completionRate.toFixed(1)}%</div>
<div class="metric"><strong>إجمالي الوقت:</strong> ${advancedMetrics.totalTimeSpent} ساعة</div>
<div class="metric"><strong>متوسط الوقت لكل مهمة:</strong> ${advancedMetrics.avgTimePerTask} ساعة</div>
</div>

<div class="section">
<h2>🎯 توزيع الأولويات</h2>
<div class="metric"><strong>أولوية عالية:</strong> ${advancedMetrics.highPriorityTasks} مهمة</div>
<div class="metric"><strong>أولوية متوسطة:</strong> ${advancedMetrics.mediumPriorityTasks} مهمة</div>
<div class="metric"><strong>أولوية منخفضة:</strong> ${advancedMetrics.lowPriorityTasks} مهمة</div>
</div>

${advancedMetrics.teamPerformance.length > 0 ? `
<div class="section">
<h2>👥 أداء الفريق</h2>
<table class="team-table">
<tr>
<th>عضو الفريق</th>
<th>إجمالي المهام</th>
<th>المهام المكتملة</th>
<th>معدل الإنجاز</th>
<th>متوسط الوقت/مهمة</th>
</tr>
${advancedMetrics.teamPerformance.slice(0, 5).map(member => `
<tr>
<td>${member.member.name}</td>
<td>${member.total}</td>
<td>${member.completed}</td>
<td>${member.completionRate.toFixed(0)}%</td>
<td>${member.avgTimePerTask}h</td>
</tr>
`).join('')}
</table>
</div>
` : ''}

<div class="section">
<h2>📊 التقدم اليومي</h2>
<p>البيانات تشمل آخر ${dailyProgressData.length} يوم من الفترة المحددة.</p>
<p><strong>إجمالي المهام المنشأة:</strong> ${dailyProgressData.reduce((sum, day) => sum + day.created, 0)}</p>
<p><strong>إجمالي المهام المكتملة:</strong> ${dailyProgressData.reduce((sum, day) => sum + day.completed, 0)}</p>
</div>

<div class="section">
<p style="text-align: center; color: #666; font-size: 12px;">
تم إنشاء هذا التقرير بواسطة ToDoOS - نظام إدارة المشاريع المتقدم
</p>
</div>

</body>
</html>`;
  };

  // Export advanced report
  const exportAdvancedReport = (format: 'json' | 'csv' | 'pdf' | 'word') => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const boardName = selectedBoard === 'all' ? 'جميع اللوحات' : 
        boards.find(b => b.id === selectedBoard)?.title || 'غير محدد';

      if (format === 'json') {
        const reportData = {
          reportType,
          dateRange,
          selectedBoard: boardName,
          generatedAt: new Date().toISOString(),
          metrics: advancedMetrics,
          dailyProgress: dailyProgressData
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
          type: 'application/json;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-متقدم-${currentDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'csv') {
        // Enhanced CSV with more data
        const csvRows = [
          ['المقياس', 'القيمة'],
          ['إجمالي المهام', advancedMetrics.totalTasks.toString()],
          ['المهام المكتملة', advancedMetrics.completedTasks.toString()],
          ['المهام المتأخرة', advancedMetrics.overdueTasks.toString()],
          ['المهام قيد التنفيذ', advancedMetrics.inProgressTasks.toString()],
          ['معدل الإنجاز', `${advancedMetrics.completionRate.toFixed(1)}%`],
          ['إجمالي الوقت المستغرق', `${advancedMetrics.totalTimeSpent} ساعة`],
          ['متوسط الوقت لكل مهمة', `${advancedMetrics.avgTimePerTask} ساعة`],
          ['مهام أولوية عالية', advancedMetrics.highPriorityTasks.toString()],
          ['مهام أولوية متوسطة', advancedMetrics.mediumPriorityTasks.toString()],
          ['مهام أولوية منخفضة', advancedMetrics.lowPriorityTasks.toString()],
          ['', ''], // Empty row
          ['أداء الفريق', ''],
          ['عضو الفريق', 'إجمالي المهام', 'المهام المكتملة', 'معدل الإنجاز', 'متوسط الوقت/مهمة']
        ];

        // Add team performance data
        advancedMetrics.teamPerformance.forEach(member => {
          csvRows.push([
            member.member.name,
            member.total.toString(),
            member.completed.toString(),
            `${member.completionRate.toFixed(1)}%`,
            `${member.avgTimePerTask}h`
          ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { 
          type: 'text/csv;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-متقدم-${currentDate}.csv`;
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
    <title>تقرير المشروع المتقدم</title>
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
        .team-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        .team-table th, .team-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: center; 
        }
        .team-table th { 
            background-color: #4CAF50; 
            color: white; 
        }
        .team-table tr:nth-child(even) {
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
        <h1>📊 تقرير المشروع المتقدم</h1>
        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        <p><strong>اللوحة:</strong> ${boardName}</p>
        <p><strong>الفترة:</strong> ${dateRange.start} إلى ${dateRange.end}</p>
    </div>

    <div class="section">
        <h2>📈 الإحصائيات الرئيسية</h2>
        <div class="metric"><strong>إجمالي المهام:</strong> ${advancedMetrics.totalTasks}</div>
        <div class="metric"><strong>المهام المكتملة:</strong> ${advancedMetrics.completedTasks}</div>
        <div class="metric"><strong>المهام المتأخرة:</strong> ${advancedMetrics.overdueTasks}</div>
        <div class="metric"><strong>المهام قيد التنفيذ:</strong> ${advancedMetrics.inProgressTasks}</div>
        <div class="metric"><strong>معدل الإنجاز:</strong> ${advancedMetrics.completionRate.toFixed(1)}%</div>
        <div class="metric"><strong>إجمالي الوقت:</strong> ${advancedMetrics.totalTimeSpent} ساعة</div>
        <div class="metric"><strong>متوسط الوقت لكل مهمة:</strong> ${advancedMetrics.avgTimePerTask} ساعة</div>
    </div>

    <div class="section">
        <h2>🎯 توزيع الأولويات</h2>
        <div class="metric"><strong>أولوية عالية:</strong> ${advancedMetrics.highPriorityTasks} مهمة</div>
        <div class="metric"><strong>أولوية متوسطة:</strong> ${advancedMetrics.mediumPriorityTasks} مهمة</div>
        <div class="metric"><strong>أولوية منخفضة:</strong> ${advancedMetrics.lowPriorityTasks} مهمة</div>
    </div>

    ${advancedMetrics.teamPerformance.length > 0 ? `
    <div class="section">
        <h2>👥 أداء الفريق</h2>
        <table class="team-table">
            <tr>
                <th>عضو الفريق</th>
                <th>إجمالي المهام</th>
                <th>المهام المكتملة</th>
                <th>معدل الإنجاز</th>
                <th>متوسط الوقت/مهمة</th>
            </tr>
            ${advancedMetrics.teamPerformance.slice(0, 10).map(member => `
            <tr>
                <td>${member.member.name}</td>
                <td>${member.total}</td>
                <td>${member.completed}</td>
                <td>${member.completionRate.toFixed(1)}%</td>
                <td>${member.avgTimePerTask}h</td>
            </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>📊 التقدم اليومي</h2>
        <p>البيانات تشمل آخر ${dailyProgressData.length} يوم من الفترة المحددة.</p>
        <div class="metric"><strong>إجمالي المهام المنشأة:</strong> ${dailyProgressData.reduce((sum, day) => sum + day.created, 0)}</div>
        <div class="metric"><strong>إجمالي المهام المكتملة:</strong> ${dailyProgressData.reduce((sum, day) => sum + day.completed, 0)}</div>
    </div>

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
        a.download = `تقرير-متقدم-${currentDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'word') {
        // Generate proper HTML for Word
        const wordContent = generateWordContent();
        const blob = new Blob([wordContent], { 
          type: 'application/msword;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-متقدم-${currentDate}.doc`;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b pt-16">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                📊 {t.reports} Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Advanced analytics and insights for your projects</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d', 'custom'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period === 'custom' ? 'Custom' : period.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportAdvancedReport('json')}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  📄 JSON
                </button>
                <button
                  onClick={() => exportAdvancedReport('csv')}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  📊 CSV
                </button>
                <button
                  onClick={() => exportAdvancedReport('pdf')}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  📑 PDF
                </button>
                <button
                  onClick={() => exportAdvancedReport('word')}
                  className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  📝 Word
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'overview' | 'productivity' | 'burndown' | 'velocity' | 'time' | 'team' | 'custom')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">📈 Overview</option>
                <option value="productivity">⚡ {t.productivity}</option>
                <option value="burndown">📉 {t.burndown}</option>
                <option value="velocity">🚀 {t.velocity}</option>
                <option value="time">⏱️ Time Analysis</option>
                <option value="team">👥 Team Performance</option>
                <option value="custom">🔧 {t.customReport}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.board}</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">🌐 All Boards</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    📋 {board.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overview Report */}
        {reportType === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">{t.tasks}</p>
                    <p className="text-3xl font-bold">{advancedMetrics.totalTasks}</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                    📋
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-100 text-sm">
                  <span>📈 {t.active} {t.projects || 'مشاريع'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">{t.completed}</p>
                    <p className="text-3xl font-bold">{advancedMetrics.completedTasks}</p>
                  </div>
                  <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                    ✅
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-100 text-sm">
                  <span>{advancedMetrics.completionRate.toFixed(1)}% {t.completionRate || 'معدل الإنجاز'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">{t.overdue || 'متأخرة'}</p>
                    <p className="text-3xl font-bold">{advancedMetrics.overdueTasks}</p>
                  </div>
                  <div className="bg-red-400 bg-opacity-30 rounded-full p-3">
                    ⚠️
                  </div>
                </div>
                <div className="mt-4 flex items-center text-red-100 text-sm">
                  <span>{t.needsAttention || 'تحتاج انتباه'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">{t.timeSpent}</p>
                    <p className="text-3xl font-bold">{advancedMetrics.totalTimeSpent}h</p>
                  </div>
                  <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                    ⏱️
                  </div>
                </div>
                <div className="mt-4 flex items-center text-purple-100 text-sm">
                  <span>{advancedMetrics.avgTimePerTask}h {t.avgPerTask || 'متوسط لكل مهمة'}</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Progress Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📈 Daily Progress
                </h3>
                <div className="h-64">
                  <div className="h-full flex items-end justify-between gap-2">
                    {dailyProgressData.slice(-14).map((day, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="flex gap-1 mb-2 items-end">
                          <div 
                            className="w-3 bg-blue-500 rounded-t"
                            style={{ height: `${Math.max(day.created * 10, 4)}px` }}
                            title={`Created: ${day.created}`}
                          />
                          <div 
                            className="w-3 bg-green-500 rounded-t"
                            style={{ height: `${Math.max(day.completed * 10, 4)}px` }}
                            title={`Completed: ${day.completed}`}
                          />
                        </div>
                        <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                          {day.dateLabel}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-600">Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🎯 Priority Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-700">High Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${advancedMetrics.totalTasks > 0 ? (advancedMetrics.highPriorityTasks / advancedMetrics.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{advancedMetrics.highPriorityTasks}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-gray-700">Medium Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${advancedMetrics.totalTasks > 0 ? (advancedMetrics.mediumPriorityTasks / advancedMetrics.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{advancedMetrics.mediumPriorityTasks}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Low Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${advancedMetrics.totalTasks > 0 ? (advancedMetrics.lowPriorityTasks / advancedMetrics.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{advancedMetrics.lowPriorityTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            {advancedMetrics.teamPerformance.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  👥 Team Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Team Member</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Tasks</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Completion Rate</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Time/Task</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancedMetrics.teamPerformance.slice(0, 5).map((member) => (
                        <tr key={member.member.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{member.member.avatar}</span>
                              <span className="font-medium text-gray-900">{member.member.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">{member.total}</td>
                          <td className="text-center py-3 px-4 text-gray-700">{member.completed}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${member.completionRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {member.completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">{member.avgTimePerTask}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other report types can be added here */}
        {reportType !== 'overview' && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
            </h3>
            <p className="text-gray-600">
              This advanced report type is coming soon with even more detailed analytics and insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReports;
