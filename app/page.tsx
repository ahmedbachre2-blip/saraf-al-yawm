'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Settings, Calculator, Clock, History, Lock, TrendingUp, TrendingDown, Save, LogOut, Loader2, Package, Store, X, Mail, Info, MessageCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioymmwdwccpqzocwtixc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveW1td2R3Y2NwcXpvY3d0aXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDY2MzQsImV4cCI6MjEwNTMyMjYzNH0.EvDv-M5Xcr6vJG50thWlNPS3JymzJbFT7k5QAjeodlI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const THRESHOLD = 1000;
const APP_VERSION = '1.0.0';
const CONTACT_EMAIL = 'ahmedbacare95@gmail.com';
const WHATSAPP_NUMBER = '213666899713';

const displayCurrency = (code: string) => code === 'DZD' ? 'DURO' : code;

const formatMoney = (num: number) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const CurrencyFlag = ({ code, size = 'lg' }: { code: string; size?: 'lg' | 'sm' }) => {
  const sz = size === 'lg' ? 'w-9 h-9 text-[11px]' : 'w-7 h-7 text-[9px]';
  if (code === 'EUR') return <span className={size === 'lg' ? 'text-3xl' : 'text-xl'}>🇪🇺</span>;
  if (code === 'MRU') return <span className={size === 'lg' ? 'text-3xl' : 'text-xl'}>🇲🇷</span>;
  if (code === 'DZD') return (
    <span className={`inline-flex items-center justify-center ${sz} rounded-md font-bold text-white border border-gray-600 shadow-sm bg-gradient-to-b from-black via-green-700 to-red-600`}>
      SH
    </span>
  );
  return null;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'converter' | 'history'>('converter');
  const [showSettings, setShowSettings] = useState(false);
  const [pin, setPin] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminMode, setAdminMode] = useState<'retail' | 'wholesale'>('retail');
  const [historyData, setHistoryData] = useState<any[]>([]);

  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('DZD');

  const [rates, setRates] = useState<any>({
    'EUR_DZD': { buy: 145, sell: 147, buyWholesale: 148, sellWholesale: 150 },
    'EUR_MRU': { buy: 42.5, sell: 44, buyWholesale: 43.5, sellWholesale: 45 },
    'DZD_MRU': { buy: 0.29, sell: 0.30, buyWholesale: 0.295, sellWholesale: 0.305 },
  });

  const [adminRates, setAdminRates] = useState<any>({
    'EUR_DZD': { buyBase: '100', buyQuote: '14500', sellBase: '100', sellQuote: '14700', buyBaseW: '1000', buyQuoteW: '148000', sellBaseW: '1000', sellQuoteW: '150000' },
    'EUR_MRU': { buyBase: '100', buyQuote: '4250', sellBase: '100', sellQuote: '4400', buyBaseW: '1000', buyQuoteW: '43500', sellBaseW: '1000', sellQuoteW: '45000' },
    'DZD_MRU': { buyBase: '100', buyQuote: '345', sellBase: '100', sellQuote: '335', buyBaseW: '1000', buyQuoteW: '3390', sellBaseW: '1000', sellQuoteW: '3280' },
  });

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchRates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('exchange_rates').select('*');
    
    if (error) {
      console.error('Error fetching rates:', error);
    } else if (data) {
      const newRates: any = {};
      const newAdminRates: any = {};
      
      data.forEach((row: any) => {
        const key = `${row.from_currency}_${row.to_currency}`;
        const buyW = row.buy_rate_wholesale || row.buy_rate * 1.02;
        const sellW = row.sell_rate_wholesale || row.sell_rate * 1.02;

        newRates[key] = {
          buy: row.buy_rate,
          sell: row.sell_rate,
          buyWholesale: buyW,
          sellWholesale: sellW,
        };

        if (row.from_currency === 'DZD' && row.to_currency === 'MRU') {
          // ✅ معالجة خاصة: نعرض "100 MRU = X DURO"
          // buy_rate = MRU per 1 DURO، لذا 100 MRU = 100/buy_rate DURO
          newAdminRates[key] = {
            buyBase: '100',
            buyQuote: (100 / row.buy_rate).toString(),
            sellBase: '100',
            sellQuote: (100 / row.sell_rate).toString(),
            buyBaseW: '1000',
            buyQuoteW: (1000 / buyW).toString(),
            sellBaseW: '1000',
            sellQuoteW: (1000 / sellW).toString(),
          };
        } else {
          newAdminRates[key] = {
            buyBase: '100',
            buyQuote: (row.buy_rate * 100).toString(),
            sellBase: '100',
            sellQuote: (row.sell_rate * 100).toString(),
            buyBaseW: '1000',
            buyQuoteW: (buyW * 1000).toString(),
            sellBaseW: '1000',
            sellQuoteW: (sellW * 1000).toString(),
          };
        }
      });
      
      setRates(newRates);
      setAdminRates(newAdminRates);
    }
    setIsLoading(false);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('rate_history')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching history:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const grouped: any = {};
      data.forEach((row: any) => {
        const key = `${row.from_currency}_${row.to_currency}`;
        if (!grouped[key]) grouped[key] = [];
        if (grouped[key].length < 2) grouped[key].push(row);
      });
      
      const result = Object.entries(grouped)
        .filter(([_, records]: any) => records.length === 2)
        .map(([key, records]: any) => ({
          key,
          from: records[0].from_currency,
          to: records[0].to_currency,
          oldBuy: records[1].buy_rate,
          newBuy: records[0].buy_rate,
        }))
        .filter((item: any) => Math.abs(item.oldBuy - item.newBuy) > 0.0001);
      
      setHistoryData(result);
    } else {
      setHistoryData([]);
    }
  };

  const saveRatesToSupabase = async () => {
    setIsSaving(true);
    const updates = Object.keys(adminRates).map(key => {
      const [from, to] = key.split('_');
      const r = adminRates[key];
      
      const numBuyBase = parseFloat(r.buyBase) || 1;
      const numBuyQuote = parseFloat(r.buyQuote) || 0;
      const numSellBase = parseFloat(r.sellBase) || 1;
      const numSellQuote = parseFloat(r.sellQuote) || 0;
      const numBuyBaseW = parseFloat(r.buyBaseW) || 1;
      const numBuyQuoteW = parseFloat(r.buyQuoteW) || 0;
      const numSellBaseW = parseFloat(r.sellBaseW) || 1;
      const numSellQuoteW = parseFloat(r.sellQuoteW) || 0;

      // ✅ معالجة خاصة لزوج DZD/MRU: المستخدم يُدخل "100 MRU = X DURO"
      // لذا buy_rate = MRU per 1 DURO = buyBase / buyQuote
      if (from === 'DZD' && to === 'MRU') {
        return {
          from_currency: from,
          to_currency: to,
          buy_rate: numBuyBase / (numBuyQuote || 1),
          sell_rate: numSellBase / (numSellQuote || 1),
          buy_rate_wholesale: numBuyBaseW / (numBuyQuoteW || 1),
          sell_rate_wholesale: numSellBaseW / (numSellQuoteW || 1),
        };
      }

      return {
        from_currency: from,
        to_currency: to,
        buy_rate: numBuyQuote / numBuyBase,
        sell_rate: numSellQuote / numSellBase,
        buy_rate_wholesale: numBuyQuoteW / numBuyBaseW,
        sell_rate_wholesale: numSellQuoteW / numSellBaseW,
      };
    });

    for (const update of updates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(update, { onConflict: 'from_currency,to_currency' });
      
      if (error) {
        console.error('Error saving:', error);
        alert('حدث خطأ أثناء الحفظ: ' + error.message);
        setIsSaving(false);
        return;
      }
      
      await supabase.from('rate_history').insert({
        from_currency: update.from_currency,
        to_currency: update.to_currency,
        buy_rate: update.buy_rate,
        sell_rate: update.sell_rate,
        buy_rate_wholesale: update.buy_rate_wholesale,
        sell_rate_wholesale: update.sell_rate_wholesale,
      });
    }
    
    await fetchRates();
    setIsSaving(false);
    alert('✅ تم حفظ الأسعار والسجل بنجاح!');
  };

  const calculateRate = (type: 'buy' | 'sell', useWholesale: boolean) => {
    if (fromCurrency === toCurrency) return 1;
    const key = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;
    
    const getRate = (r: any, t: string, w: boolean) => {
      if (w) return t === 'buy' ? r.buyWholesale : r.sellWholesale;
      return t === 'buy' ? r.buy : r.sell;
    };
    
    if (rates[key]) return getRate(rates[key], type, useWholesale);
    if (rates[reverseKey]) {
      const revType = type === 'buy' ? 'sell' : 'buy';
      return 1 / getRate(rates[reverseKey], revType, useWholesale);
    }
    return 1;
  };

  const numericAmount = parseFloat(amount) || 0;
  const useWholesale = numericAmount >= THRESHOLD;
  const buyRate = calculateRate('buy', useWholesale);
  const sellRate = calculateRate('sell', useWholesale);
  const amountBuy = formatMoney(numericAmount * buyRate);
  const amountSell = formatMoney(numericAmount * sellRate);

  const handlePinSubmit = () => {
    if (pin === '069801') {
      setIsAdmin(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setIsAdmin(false);
    setPin('');
    setPinError(false);
  };

  const updateAdminRate = (key: string, field: string, value: string) => {
    setAdminRates((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const isRetail = adminMode === 'retail';
  const suffix = isRetail ? '' : 'W';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        <span className="mr-3 text-lg">جاري تحميل الأسعار...</span>
      </div>
    );
  }

  if (showSettings) {
    return (
      <main className="min-h-screen bg-[#0B1120] text-white font-sans p-4" dir="rtl">
        <header className="flex justify-between items-center mb-6 pt-2">
          <div className="flex items-center gap-3">
            <button onClick={handleCloseSettings} className="p-2 bg-[#112240] rounded-full border border-[#233554]">
              <X className="text-gray-400 w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">الإعدادات</h1>
          </div>
        </header>

        {!isAdmin ? (
          <div className="space-y-6">
            <div className="bg-[#112240] p-6 rounded-3xl border border-[#233554] text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-green-500/30">💱</div>
              <h2 className="text-2xl font-bold mb-1">صرف اليوم</h2>
              <p className="text-sm text-gray-400 mb-4">تطبيق أسعار الصرف في الصحراء الغربية</p>
              <div className="inline-flex items-center gap-1.5 bg-[#0B1120] px-3 py-1.5 rounded-full border border-[#233554] text-xs text-gray-400">
                <Info className="w-3.5 h-3.5" />
                الإصدار {APP_VERSION}
              </div>
            </div>

            <div className="bg-[#112240] p-5 rounded-3xl border border-[#233554]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold">تواصل معنا</h3>
                  <p className="text-xs text-gray-400">لأي استفسار أو مشكلة</p>
                </div>
              </div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="block w-full bg-[#0B1120] border border-[#233554] rounded-xl p-3 text-center text-sm text-blue-400 hover:border-blue-500 transition">
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="bg-[#112240] p-6 rounded-3xl border border-[#233554]">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-[#0B1120] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#233554]">
                  <Lock className="text-green-500 w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1">دخول الموظفين</h3>
                <p className="text-xs text-gray-400">أدخل الرمز السري للمتابعة</p>
              </div>
              
              <input 
                type="password" 
                maxLength={6} 
                value={pin} 
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                className={`w-full bg-[#0B1120] border ${pinError ? 'border-red-500' : 'border-[#233554]'} rounded-xl py-4 text-center text-2xl tracking-[1em] outline-none focus:border-green-500 transition`} 
                placeholder="••••••" 
              />
              {pinError && <p className="text-red-500 text-xs mt-2 text-center">الرمز غير صحيح، حاول مرة أخرى.</p>}
              <button 
                onClick={handlePinSubmit} 
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
              >
                متابعة
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#112240] p-5 rounded-3xl border border-[#233554]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#233554]">
              <h2 className="text-lg font-bold text-green-400">لوحة تحكم الموظفين</h2>
              <button onClick={() => { setIsAdmin(false); setPin(''); }} className="text-red-400 text-sm flex items-center gap-1">
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6 bg-[#0B1120] p-1 rounded-xl border border-[#233554]">
              <button onClick={() => setAdminMode('retail')} className={`py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition ${adminMode === 'retail' ? 'bg-green-500 text-white' : 'text-gray-400'}`}>
                <Store className="w-4 h-4" /> تجزئة
              </button>
              <button onClick={() => setAdminMode('wholesale')} className={`py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition ${adminMode === 'wholesale' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>
                <Package className="w-4 h-4" /> جملة
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                { key: 'EUR_DZD', fromCode: 'EUR', toCode: 'DZD', flipped: false },
                { key: 'EUR_MRU', fromCode: 'EUR', toCode: 'MRU', flipped: false },
                { key: 'DZD_MRU', fromCode: 'DZD', toCode: 'MRU', flipped: true },
              ].map((pair) => {
                // rightCode هو العملة المعروضة على اليمين (كأساس)
                const rightCode = pair.flipped ? 'MRU' : pair.fromCode;
                const leftCode = pair.flipped ? pair.fromCode : pair.toCode;
                
                return (
                  <div key={pair.key} className="bg-[#0B1120] p-4 rounded-xl border border-[#233554]">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <CurrencyFlag code={rightCode} size="sm" />
                      <span className="text-gray-400 font-bold">=</span>
                      <CurrencyFlag code={leftCode} size="sm" />
                      <span className="font-bold text-sm text-yellow-400 mr-2">
                        {displayCurrency(rightCode)} / {displayCurrency(leftCode)}
                      </span>
                    </div>
                    
                    <div className="mb-4 bg-[#112240] p-3 rounded-lg border border-blue-500/30">
                      <p className="text-xs font-bold text-blue-400 mb-2">سعر الشراء</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input type="text" inputMode="numeric" value={adminRates[pair.key]?.[`buyBase${suffix}`] || ''} onChange={(e) => updateAdminRate(pair.key, `buyBase${suffix}`, e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-[#0B1120] border border-[#233554] rounded-lg p-2 text-center font-bold text-sm" />
                          <p className="text-[10px] text-gray-500 text-center mt-1">{displayCurrency(rightCode)}</p>
                        </div>
                        <span className="text-gray-400 font-bold">=</span>
                        <div className="flex-1">
                          <input type="text" inputMode="numeric" value={adminRates[pair.key]?.[`buyQuote${suffix}`] || ''} onChange={(e) => updateAdminRate(pair.key, `buyQuote${suffix}`, e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-[#0B1120] border border-[#233554] rounded-lg p-2 text-center font-bold text-sm" />
                          <p className="text-[10px] text-gray-500 text-center mt-1">{displayCurrency(leftCode)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#112240] p-3 rounded-lg border border-green-500/30">
                      <p className="text-xs font-bold text-green-400 mb-2">سعر البيع</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input type="text" inputMode="numeric" value={adminRates[pair.key]?.[`sellBase${suffix}`] || ''} onChange={(e) => updateAdminRate(pair.key, `sellBase${suffix}`, e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-[#0B1120] border border-[#233554] rounded-lg p-2 text-center font-bold text-sm" />
                          <p className="text-[10px] text-gray-500 text-center mt-1">{displayCurrency(rightCode)}</p>
                        </div>
                        <span className="text-gray-400 font-bold">=</span>
                        <div className="flex-1">
                          <input type="text" inputMode="numeric" value={adminRates[pair.key]?.[`sellQuote${suffix}`] || ''} onChange={(e) => updateAdminRate(pair.key, `sellQuote${suffix}`, e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-[#0B1120] border border-[#233554] rounded-lg p-2 text-center font-bold text-sm" />
                          <p className="text-[10px] text-gray-500 text-center mt-1">{displayCurrency(leftCode)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={saveRatesToSupabase} disabled={isSaving} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition mt-4 shadow-lg shadow-blue-500/20">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات والسجل'}
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1120] text-white font-sans p-4 pb-24" dir="rtl">
      <header className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xl shadow-lg shadow-green-500/20">💱</div>
          <div>
            <h1 className="text-2xl font-bold text-white">صرف اليوم</h1>
            <p className="text-xs text-gray-400 mt-0.5">حول أموالك بسهولة وأمان</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 bg-[#112240] rounded-full border border-[#233554] hover:border-green-500 transition">
          <Settings className="text-gray-400 w-5 h-5" />
        </button>
      </header>

      {activeTab === 'converter' && (
        <div className="animate-fadeIn">
          <div className="bg-[#112240] p-4 rounded-2xl mb-6 flex justify-between items-center border border-[#233554] relative overflow-hidden">
            <div className="z-10">
              <h2 className="font-bold text-green-400 flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                أسعار السوق اليوم
              </h2>
              <p className="text-xs text-gray-400 mt-2">
                {useWholesale ? `سعر الجملة (${THRESHOLD}+)` : 'سعر التجزئة'}
              </p>
            </div>
            <div className="text-4xl z-10 flex gap-1">💶<span className="text-2xl mt-2">➡️</span>💰</div>
          </div>

          <div className="bg-[#112240] rounded-3xl p-5 border border-[#233554] mb-6 shadow-xl">
            <div className="flex justify-between items-center bg-[#0B1120] rounded-2xl p-4 mb-3 border border-[#233554]">
              <div className="flex items-center gap-3">
                <CurrencyFlag code={fromCurrency} />
                <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="bg-transparent text-white font-bold outline-none text-lg cursor-pointer">
                  <option value="EUR" className="bg-[#112240]">EUR - يورو</option>
                  <option value="DZD" className="bg-[#112240]">DURO - دورو صحراوي</option>
                  <option value="MRU" className="bg-[#112240]">MRU - أوقية موريتانية</option>
                </select>
              </div>
              <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="bg-transparent text-left text-2xl font-bold w-28 outline-none text-white placeholder-gray-500" placeholder="0" />
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <button onClick={() => { const temp = fromCurrency; setFromCurrency(toCurrency); setToCurrency(temp); }} className="bg-[#0B1120] border-2 border-green-500 rounded-full p-2.5 hover:bg-[#1a2b4c] transition shadow-lg shadow-green-500/20">
                <ArrowRightLeft className="text-green-500 w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-[#0B1120] rounded-2xl p-4 mt-3 border border-[#233554]">
              <div className="flex items-center gap-3">
                <CurrencyFlag code={toCurrency} />
                <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="bg-transparent text-white font-bold outline-none text-lg cursor-pointer">
                  <option value="DZD" className="bg-[#112240]">DURO - دورو صحراوي</option>
                  <option value="EUR" className="bg-[#112240]">EUR - يورو</option>
                  <option value="MRU" className="bg-[#112240]">MRU - أوقية موريتانية</option>
                </select>
              </div>
              <div className="text-left space-y-1">
                <p className="text-lg font-bold text-blue-400">شراء: {amountBuy}</p>
                <p className="text-lg font-bold text-green-400">بيع: {amountSell}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#112240] rounded-2xl p-4 border border-[#233554] mb-8 flex justify-between items-center">
            <div className="border-r-4 border-green-500 pr-3 space-y-2">
              <p className="text-sm font-bold">1 {displayCurrency(fromCurrency)} = <span className="text-blue-400 mr-1">{formatMoney(buyRate)}</span> (شراء) | <span className="text-green-400 mr-1">{formatMoney(sellRate)}</span> (بيع)</p>
              <p className="text-xs text-gray-400">آخر تحديث: اليوم</p>
            </div>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=مرحباً، أريد الاستفسار عن أسعار الصرف`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#1EBE5D] active:scale-[0.98] text-white font-bold py-4 rounded-2xl mb-8 flex justify-center items-center gap-2 transition-all shadow-lg shadow-[#25D366]/25"
          >
            <MessageCircle className="w-6 h-6" /> تواصل معنا عبر واتساب
          </a>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-fadeIn">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-5 mb-6 text-center">
            <h2 className="text-xl font-bold text-green-400 mb-1">مرحباً بك عزيزي الزبون 👋</h2>
            <p className="text-sm text-gray-300">آخر تغييرات أسعار الصرف</p>
          </div>
          
          {historyData.length === 0 ? (
            <div className="bg-[#112240] p-8 rounded-2xl border border-[#233554] text-center">
              <History className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">لا يوجد سجل تغييرات بعد.</p>
              <p className="text-xs text-gray-500 mt-2">سيظهر السجل بعد قيام الموظفين بتحديث الأسعار مرتين على الأقل.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyData.map((item: any, idx: number) => {
                const isDzdMru = item.from === 'DZD' && item.to === 'MRU';
                // ✅ لزوج DZD/MRU نعرض "100 MRU = X DURO"
                const oldAmount = isDzdMru ? (100 / item.oldBuy) : (100 * item.oldBuy);
                const newAmount = isDzdMru ? (100 / item.newBuy) : (100 * item.newBuy);
                const diffAmount = isDzdMru 
                  ? Math.abs((100 / item.newBuy) - (100 / item.oldBuy)) 
                  : Math.abs((item.newBuy - item.oldBuy) * 100);
                const isUp = isDzdMru ? (item.newBuy < item.oldBuy) : (item.newBuy > item.oldBuy);
                const isDown = isDzdMru ? (item.newBuy > item.oldBuy) : (item.newBuy < item.oldBuy);
                const fromDisplay = isDzdMru ? 'MRU' : displayCurrency(item.from);
                const toDisplay = isDzdMru ? 'DURO' : displayCurrency(item.to);
                
                return (
                  <div key={idx} className="bg-[#112240] p-4 rounded-2xl border border-[#233554]">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <CurrencyFlag code={isDzdMru ? 'MRU' : item.from} size="sm" />
                        <span className="font-bold text-lg">{fromDisplay}</span>
                        <span className="text-gray-500">➡️</span>
                        <CurrencyFlag code={isDzdMru ? 'DZD' : item.to} size="sm" />
                        <span className="font-bold text-lg">{toDisplay}</span>
                      </div>
                      {isUp && <TrendingUp className="text-red-400 w-5 h-5" />}
                      {isDown && <TrendingDown className="text-green-400 w-5 h-5" />}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">سابقاً: 100 {fromDisplay} = <span className="text-gray-400">{formatMoney(oldAmount)} {toDisplay}</span></p>
                      <p className="text-gray-300">الآن: 100 {fromDisplay} = <span className="text-white font-bold">{formatMoney(newAmount)} {toDisplay}</span></p>
                      {isUp && <p className="font-bold text-red-400 mt-2">📈 زاد السعر بـ {formatMoney(diffAmount)} {toDisplay}</p>}
                      {isDown && <p className="font-bold text-green-400 mt-2">📉 نقص السعر بـ {formatMoney(diffAmount)} {toDisplay}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#112240]/95 backdrop-blur-md border-t border-[#233554] flex justify-around p-3 pb-6 z-50" dir="rtl">
        <button onClick={() => setActiveTab('converter')} className={`flex flex-col items-center ${activeTab === 'converter' ? 'text-green-500' : 'text-gray-500'}`}>
          <ArrowRightLeft className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-bold">التحويل</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-green-500' : 'text-gray-500'}`}>
          <History className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-bold">السجل</span>
        </button>
      </nav>
    </main>
  );
}