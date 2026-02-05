
import React, { useState, useCallback, useMemo } from 'react';
import { 
  ClipboardCheck, 
  ArrowDownNarrowWide, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Wallet,
  Trash2,
  RefreshCw,
  Search,
  ArrowUpDown,
  Filter,
  ListFilter
} from 'lucide-react';
import { DifferenceType, MatchingResult, ComparisonSummary } from './types';

// Utility to parse pasted text into numbers
const parseInput = (text: string): number[] => {
  return text
    .split(/[\n\t,]/)
    .map(val => val.trim())
    .filter(val => val !== '' && !isNaN(Number(val)))
    .map(Number);
};

export default function App() {
  const [systemInput, setSystemInput] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | DifferenceType>('ALL');

  // Core Matching Algorithm
  const handleMatch = useCallback(() => {
    setIsProcessing(true);
    
    // 1. Extract and Clean Data
    const systemNumbers = parseInput(systemInput);
    const walletNumbers = parseInput(walletInput);

    // 2. Initial Sort (Largest to Smallest as requested)
    const sortedSystem = [...systemNumbers].sort((a, b) => b - a);
    const sortedWallet = [...walletNumbers].sort((a, b) => b - a);

    // 3. Frequency Analysis for precise accounting
    const systemMap = new Map<number, number>();
    const walletMap = new Map<number, number>();

    sortedSystem.forEach(n => systemMap.set(n, (systemMap.get(n) || 0) + 1));
    sortedWallet.forEach(n => walletMap.set(n, (walletMap.get(n) || 0) + 1));

    const allUniqueValues = Array.from(new Set([...sortedSystem, ...sortedWallet]))
      .sort((a, b) => b - a);

    const matchResults: MatchingResult[] = [];

    // 4. Iterate and Compare
    allUniqueValues.forEach(val => {
      const sCount = systemMap.get(val) || 0;
      const wCount = walletMap.get(val) || 0;

      if (sCount === wCount && sCount > 0) {
        // Full Match
        matchResults.push({
          value: val,
          status: DifferenceType.MATCHED,
          description: 'مطابق تماماً',
          systemCount: sCount,
          walletCount: wCount
        });
      } else if (sCount > 0 && wCount === 0) {
        // System Only
        matchResults.push({
          value: val,
          status: DifferenceType.SYSTEM_ONLY,
          description: 'موجود في النظام وغير موجود في المحفظة',
          systemCount: sCount,
          walletCount: wCount
        });
      } else if (wCount > 0 && sCount === 0) {
        // Wallet Only
        matchResults.push({
          value: val,
          status: DifferenceType.WALLET_ONLY,
          description: 'موجود في المحفظة وغير موجود في النظام',
          systemCount: sCount,
          walletCount: wCount
        });
      } else if (sCount !== wCount) {
        // Frequency Mismatch (Duplicate logic)
        matchResults.push({
          value: val,
          status: DifferenceType.FREQUENCY_MISMATCH,
          description: `فرق في عدد التكرار (نظام: ${sCount}, محفظة: ${wCount})`,
          systemCount: sCount,
          walletCount: wCount
        });
      }
    });

    setResults(matchResults);
    setActiveFilter('ALL'); // Reset filter on new match
    setIsProcessing(false);
  }, [systemInput, walletInput]);

  const clearData = () => {
    setSystemInput('');
    setWalletInput('');
    setResults([]);
    setActiveFilter('ALL');
  };

  const summary = useMemo((): ComparisonSummary => {
    const diffs = results.filter(r => r.status !== DifferenceType.MATCHED);
    const matched = results.filter(r => r.status === DifferenceType.MATCHED);
    
    return {
      totalSystem: parseInput(systemInput).length,
      totalWallet: parseInput(walletInput).length,
      matchedCount: matched.length,
      differencesCount: diffs.length
    };
  }, [results, systemInput, walletInput]);

  // Filtering Logic
  const filteredResults = useMemo(() => {
    if (activeFilter === 'ALL') return results;
    return results.filter(item => item.status === activeFilter);
  }, [results, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-right" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ClipboardCheck size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">مطابق الذكي</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={clearData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              مسح البيانات
            </button>
            <button 
              onClick={handleMatch}
              disabled={isProcessing || (!systemInput && !walletInput)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={18} className={isProcessing ? 'animate-spin' : ''} />
              ابدأ المطابقة
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <FileSpreadsheet size={20} />
              <h2 className="font-bold">بيانات النظام</h2>
            </div>
            <textarea
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm text-right"
              placeholder="الصق عمود أرقام النظام هنا..."
              value={systemInput}
              onChange={(e) => setSystemInput(e.target.value)}
            />
            <div className="mt-2 text-xs text-slate-400">عدد المدخلات: {parseInput(systemInput).length}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <Wallet size={20} />
              <h2 className="font-bold">بيانات المحفظة</h2>
            </div>
            <textarea
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm text-right"
              placeholder="الصق عمود أرقام المحفظة هنا..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
            />
            <div className="mt-2 text-xs text-slate-400">عدد المدخلات: {parseInput(walletInput).length}</div>
          </div>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard 
              label="إجمالي النظام" 
              value={summary.totalSystem} 
              icon={<FileSpreadsheet size={20} />} 
              color="blue" 
            />
            <SummaryCard 
              label="إجمالي المحفظة" 
              value={summary.totalWallet} 
              icon={<Wallet size={20} />} 
              color="emerald" 
            />
            <SummaryCard 
              label="مطابقات صحيحة" 
              value={summary.matchedCount} 
              icon={<CheckCircle2 size={20} />} 
              color="indigo" 
            />
            <SummaryCard 
              label="إجمالي الفوارق" 
              value={summary.differencesCount} 
              icon={<AlertCircle size={20} />} 
              color="rose" 
            />
          </div>
        )}

        {/* Filter Bar */}
        {results.length > 0 && (
          <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4 text-slate-600">
              <ListFilter size={20} />
              <h3 className="font-bold">عرض النتائج حسب:</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterTab 
                active={activeFilter === 'ALL'} 
                label="الكل" 
                count={results.length} 
                onClick={() => setActiveFilter('ALL')} 
                color="slate"
              />
              <FilterTab 
                active={activeFilter === DifferenceType.SYSTEM_ONLY} 
                label="في النظام وغير موجود بالمحفظة" 
                count={results.filter(r => r.status === DifferenceType.SYSTEM_ONLY).length} 
                onClick={() => setActiveFilter(DifferenceType.SYSTEM_ONLY)} 
                color="blue"
              />
              <FilterTab 
                active={activeFilter === DifferenceType.WALLET_ONLY} 
                label="في المحفظة وغير موجود بالنظام" 
                count={results.filter(r => r.status === DifferenceType.WALLET_ONLY).length} 
                onClick={() => setActiveFilter(DifferenceType.WALLET_ONLY)} 
                color="emerald"
              />
              <FilterTab 
                active={activeFilter === DifferenceType.FREQUENCY_MISMATCH} 
                label="تكرار متباين (مبالغ مكررة)" 
                count={results.filter(r => r.status === DifferenceType.FREQUENCY_MISMATCH).length} 
                onClick={() => setActiveFilter(DifferenceType.FREQUENCY_MISMATCH)} 
                color="rose"
              />
              <FilterTab 
                active={activeFilter === DifferenceType.MATCHED} 
                label="المطابقات" 
                count={results.filter(r => r.status === DifferenceType.MATCHED).length} 
                onClick={() => setActiveFilter(DifferenceType.MATCHED)} 
                color="indigo"
              />
            </div>
          </div>
        )}

        {/* Detailed Results Table */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ArrowDownNarrowWide className="text-slate-500" />
                <h3 className="font-bold text-slate-700">نتائج الفحص والمطابقة (مرتبة من الأكبر للأصغر)</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase">
                    <th className="px-6 py-4 font-semibold">القيمة</th>
                    <th className="px-6 py-4 font-semibold">الحالة</th>
                    <th className="px-6 py-4 font-semibold text-center">النظام (تكرار)</th>
                    <th className="px-6 py-4 font-semibold text-center">المحفظة (تكرار)</th>
                    <th className="px-6 py-4 font-semibold">الوصف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.length > 0 ? filteredResults.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50 transition-colors ${item.status !== DifferenceType.MATCHED ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">{item.value.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-center font-mono">{item.systemCount}</td>
                      <td className="px-6 py-4 text-center font-mono">{item.walletCount}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.description}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        لا توجد نتائج لهذا التصنيف
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-slate-400">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <Search size={48} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium">أدخل البيانات أعلاه واضغط على "ابدأ المطابقة" لظهور النتائج</p>
            <p className="text-sm">سيتم ترتيب الأرقام تلقائياً وتحديد كافة الفروقات المحتملة.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components for better organization

function FilterTab({ 
  active, 
  label, 
  count, 
  onClick, 
  color 
}: { 
  active: boolean, 
  label: string, 
  count: number, 
  onClick: () => void, 
  color: 'blue' | 'emerald' | 'rose' | 'slate' | 'indigo' 
}) {
  const baseClasses = "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border shadow-sm active:scale-95";
  
  const colors = {
    blue: active ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200',
    emerald: active ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200',
    rose: active ? 'bg-rose-600 border-rose-600 text-white shadow-rose-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200',
    slate: active ? 'bg-slate-800 border-slate-800 text-white shadow-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
    indigo: active ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200',
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${colors[color]}`}>
      {label}
      <span className={`px-2 py-0.5 rounded-lg text-xs ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
        {count}
      </span>
    </button>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'emerald' | 'indigo' | 'rose' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700'
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DifferenceType }) {
  switch (status) {
    case DifferenceType.MATCHED:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="ml-1" /> مطابق
        </span>
      );
    case DifferenceType.SYSTEM_ONLY:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <FileSpreadsheet size={12} className="ml-1" /> نظام فقط
        </span>
      );
    case DifferenceType.WALLET_ONLY:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <Wallet size={12} className="ml-1" /> محفظة فقط
        </span>
      );
    case DifferenceType.FREQUENCY_MISMATCH:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
          <ArrowUpDown size={12} className="ml-1" /> تكرار متباين
        </span>
      );
    default:
      return null;
  }
}
