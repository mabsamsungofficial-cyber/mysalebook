import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, LayoutDashboard, Settings, Loader2, AlertCircle, Smartphone, ChevronRight, ArrowLeft, Plus, Trash2, AlertTriangle, Calendar, ScanLine, Tag, X, Check, Menu, HardDrive, RefreshCw, Eye, EyeOff, Edit2, ChevronDown, ChevronUp, Download, Upload, Database, Save, FileDown, Watch, Target, Lock, Unlock, BarChart3, List } from 'lucide-react';

// ==========================================
// 1. CONSTANTS, DEFAULTS & HELPERS
// ==========================================
const BASE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1uipnUzwMNwBJWRJ6qhp4RPnlpuBHwYGaWbwEsmatHJY/export?format=csv&gid=";

const SHEET_TABS = [
  { name: 'A Series', gid: '2014959364' },
  { name: 'S & FE Series', gid: '2085730153' },
  { name: 'M & F Series', gid: '327181163' },
  { name: 'Tab Series', gid: '255331010' },
  { name: 'Gear Bud', gid: '596867009' }
];

const DEFAULT_SLABS = {
  smartphone: [
    { id: 's1', label: '< 10K', min: 0, max: 9999, amount: 0 },
    { id: 's2', label: '10K - 15K', min: 10000, max: 14999, amount: 30 },
    { id: 's3', label: '15K - 20K', min: 15000, max: 19999, amount: 75 },
    { id: 's4', label: '20K - 30K', min: 20000, max: 29999, amount: 250 },
    { id: 's5', label: '30K - 40K', min: 30000, max: 39999, amount: 300 },
    { id: 's6', label: '40K - 70K', min: 40000, max: 69999, amount: 500 },
    { id: 's7', label: '70K - 100K', min: 70000, max: 99999, amount: 600 },
    { id: 's8', label: '100K & Above', min: 100000, max: 9999999, amount: 700 }
  ],
  tab: [
    { id: 't1', label: '< 10K', min: 0, max: 9999, amount: 0 },
    { id: 't2', label: '10K - 15K', min: 10000, max: 14999, amount: 100 },
    { id: 't3', label: '15K - 20K', min: 15000, max: 19999, amount: 200 },
    { id: 't4', label: '20K - 30K', min: 20000, max: 29999, amount: 300 },
    { id: 't5', label: '30K - 40K', min: 30000, max: 39999, amount: 500 },
    { id: 't6', label: '40K - 70K', min: 40000, max: 69999, amount: 600 },
    { id: 't7', label: '70K & Above', min: 70000, max: 9999999, amount: 800 }
  ],
  tabExceptions: [
    { id: 'te1', models: 'S11 Ultra', amount: 1500 },
    { id: 'te2', models: 'S11, S10 Plus, S10 FE', amount: 1000 },
    { id: 'te3', models: 'S10 Lite', amount: 750 },
    { id: 'te4', models: 'A11 Plus', amount: 400 },
    { id: 'te5', models: 'A11', amount: 250 } 
  ],
  wearableExceptions: [
    { id: 'we1', models: 'Ring', amount: 3000 },
    { id: 'we2', models: 'Watch Ultra, Watch 8 Classic, Watch8 Classic', amount: 1200 },
    { id: 'we3', models: 'Watch 8, Watch8', amount: 800 },
    { id: 'we4', models: 'Watch', amount: 500 },
    { id: 'we5', models: 'Buds 4 Pro, Buds4 Pro', amount: 800 },
    { id: 'we6', models: 'Buds 4, Buds4, Buds 3 Pro, Buds3 Pro', amount: 600 },
    { id: 'we7', models: 'Buds 3, Buds3, FE', amount: 400 },
    { id: 'we8', models: 'Buds', amount: 200 }
  ],
  smartphoneExceptions: [], 
  mfExceptions: "F17, F56, M56",
  targets: {}
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const getDPNumber = (dpString) => {
  if (!dpString) return 0;
  return parseInt(String(dpString).replace(/[^0-9]/g, ''), 10) || 0;
};

// HELPER: Device Category Detect karne ke liye
const getDeviceCategory = (model) => {
  if (!model) return 'smartphone';
  const upperName = (model.modelName || '').toUpperCase();
  const upperCode = (model.modelCode || '').toUpperCase();
  
  const isWearableTab = model.seriesGid === '596867009';
  const isWearableKeyword = upperName.includes('WATCH') || upperCode.includes('WATCH') || upperName.includes('BUDS') || upperCode.includes('BUDS') || upperName.includes('RING') || upperCode.includes('RING');
  if (isWearableTab || isWearableKeyword) return 'wearable';

  const isTabTab = model.seriesGid === '255331010';
  const isTabKeyword = upperName.includes('TAB ') || upperCode.includes('TAB ');
  if (isTabTab || isTabKeyword) return 'tablet';

  return 'smartphone';
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function App() {
  const [activeBottomTab, setActiveBottomTab] = useState('dashboard');
  const [activeSeries, setActiveSeries] = useState('ALL'); 
  const [activeSettingsPage, setActiveSettingsPage] = useState('main');
  const [expandedSection, setExpandedSection] = useState('smartphone');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null); 
  const [expandedSaleId, setExpandedSaleId] = useState(null); 
  const [showIncentive, setShowIncentive] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null); 
  const [backupDataToRestore, setBackupDataToRestore] = useState(null); 
  const [showTargetModal, setShowTargetModal] = useState(false);
  
  // MONTH FILTER OR HISTORY VIEW TYPE KE LIYE
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [historyViewMode, setHistoryViewMode] = useState('date'); // 'date' ya 'model'

  const [allModels, setAllModels] = useState([]); 
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);
  
  const [sales, setSales] = useState(() => {
    try {
      const localData = localStorage.getItem('salebook_data_sales');
      return localData ? JSON.parse(localData) : [];
    } catch (e) { return []; }
  });

  const [incentiveSlabs, setIncentiveSlabs] = useState(() => {
    try {
      const localData = localStorage.getItem('salebook_data_settings');
      if (localData) {
        let parsed = JSON.parse(localData);
        const hasOldFormat = parsed.wearableExceptions && parsed.wearableExceptions.some(e => e.models === 'Buds 4 Pro');
        const hasNewFormat = parsed.wearableExceptions && parsed.wearableExceptions.some(e => e.models.includes('Buds4 Pro'));
        if (hasOldFormat && !hasNewFormat) parsed.wearableExceptions = DEFAULT_SLABS.wearableExceptions;

        return {
          ...DEFAULT_SLABS,
          ...parsed,
          smartphoneExceptions: parsed.smartphoneExceptions || [],
          tabExceptions: parsed.tabExceptions || [],
          wearableExceptions: parsed.wearableExceptions || DEFAULT_SLABS.wearableExceptions,
          targets: parsed.targets || {}
        };
      }
    } catch (e) { }
    return DEFAULT_SLABS;
  });
  
  const [draftSlabs, setDraftSlabs] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [saleForm, setSaleForm] = useState({ date: getTodayString(), imei: '', selloutSupport: '', upgrade: '' });
  const [saleModelQuery, setSaleModelQuery] = useState('');
  const [selectedSaleModel, setSelectedSaleModel] = useState(null);

  const [targetForm, setTargetForm] = useState({ 
    month: selectedMonth, volume: '', value: '', gate: '', gateBasis: 'volume' 
  });
  const [isTargetExpanded, setIsTargetExpanded] = useState(false);

  const fileInputRef = useRef(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // ZOOM & DEVTOOLS LOCK EFFECT
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name=viewport]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    const disableDevTools = (e) => {
      if (e.keyCode === 123 || e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) e.preventDefault();
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) e.preventDefault();
    };

    const disableContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', disableDevTools);
    window.addEventListener('contextmenu', disableContextMenu);

    return () => {
      window.removeEventListener('keydown', disableDevTools);
      window.removeEventListener('contextmenu', disableContextMenu);
    };
  }, []);

  const showNotification = (msg) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  useEffect(() => { localStorage.setItem('salebook_data_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('salebook_data_settings', JSON.stringify(incentiveSlabs)); }, [incentiveSlabs]);

  const fetchModelsFromSheet = async () => {
    setLoadingModels(true);
    setModelsError(null);
    let hasFetchError = false;

    try {
      const promises = SHEET_TABS.map(async (tab) => {
        try {
          const response = await fetch(`${BASE_SHEET_URL}${tab.gid}`);
          if (!response.ok) throw new Error("Network error fetching sheet");
          const text = await response.text();
          if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) throw new Error("Google Sheet appears to be private or inaccessible.");

          const rows = text.split(/\r?\n/)
            .map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"').trim()))
            .filter(row => row.length > 0 && row.some(cell => cell !== '')); 

          if (rows.length === 0) return [];

          let headers = rows[0].map(h => h.toLowerCase());
          let dataRows = rows.slice(1);

          let codeIdx = headers.findIndex(h => h.includes('code') || h.includes('id'));
          let modelIdx = headers.findIndex(h => h === 'model' || h.includes('name') || h.includes('naam'));
          let dpIdx = headers.findIndex(h => h === 'dp' || h.includes('price') || h.includes('mop') || h.includes('mrp'));

          codeIdx = codeIdx === -1 ? 0 : codeIdx;
          modelIdx = modelIdx === -1 ? 1 : modelIdx;
          dpIdx = dpIdx === -1 ? 2 : dpIdx;

          return dataRows.map((cells, index) => {
            const code = cells[codeIdx] ? String(cells[codeIdx]).trim() : '';
            let name = cells[modelIdx] ? String(cells[modelIdx]).trim() : '';
            const dp = cells[dpIdx] ? String(cells[dpIdx]).trim() : '';
            name = name.replace(/\bUG\b/gi, '').replace(/\bBCB\b/gi, '').replace(/F\/S/gi, '').replace(/\(\s*\)/g, '').replace(/_/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();
            return { id: `${tab.gid}-${index}`, seriesGid: tab.gid, modelCode: code, modelName: name, dp: dp };
          }).filter(item => item && item.modelName && item.modelName.toLowerCase() !== 'model' && !item.modelName.toLowerCase().includes('cash sell'));
        } catch (err) {
          hasFetchError = true;
          return [];
        }
      });

      const results = await Promise.all(promises);
      const combinedModels = results.flat();
      if (combinedModels.length === 0 && hasFetchError) throw new Error("Failed to fetch data.");

      const uniqueModelsMap = new Map();
      combinedModels.forEach(model => {
        let identifier = model.modelCode || model.modelName; 
        let baseCode = identifier.split(' ')[0].trim().toUpperCase();
        if (!baseCode) return;

        const upperName = model.modelName.toUpperCase();
        const upperCode = model.modelCode.toUpperCase();
        
        if (upperName.includes('WT/TA') || upperCode.includes('WT/TA') || upperName.includes('(WT/TA)')) baseCode += '_WITH_TA';
        else if (upperName.includes('WO/TA') || upperCode.includes('WO/TA') || upperName.includes('(WO/TA)')) baseCode += '_WITHOUT_TA';

        if (!uniqueModelsMap.has(baseCode)) {
          uniqueModelsMap.set(baseCode, model);
        } else {
          const existing = uniqueModelsMap.get(baseCode);
          const existingHasDp = existing.dp && existing.dp.toString().trim() !== '';
          const newHasDp = model.dp && model.dp.toString().trim() !== '';
          if (!existingHasDp && newHasDp) uniqueModelsMap.set(baseCode, model);
          else if (existingHasDp && newHasDp && model.modelCode.length < existing.modelCode.length) uniqueModelsMap.set(baseCode, model);
        }
      });

      setAllModels(Array.from(uniqueModelsMap.values()));
    } catch (err) {
      setModelsError(err.message || "Data fetch error.");
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => { fetchModelsFromSheet(); }, []);

  const calculateIncentive = (model) => {
    const dpNumber = getDPNumber(model.dp);
    const category = getDeviceCategory(model);
    
    let activeExceptions = category === 'wearable' ? (incentiveSlabs.wearableExceptions || []) : (category === 'tablet' ? (incentiveSlabs.tabExceptions || []) : (incentiveSlabs.smartphoneExceptions || []));
    const upperName = (model.modelName || '').toUpperCase();
    const upperCode = (model.modelCode || '').toUpperCase();
    
    for (let exc of activeExceptions) {
      if (!exc.models || String(exc.models).trim() === '') continue;
      const focusModelsArray = String(exc.models).split(',').map(s => s.trim().toUpperCase());
      const isMatch = focusModelsArray.some(focusModel => focusModel && (upperName.includes(focusModel) || upperCode.includes(focusModel)));
      if (isMatch) return parseInt(exc.amount, 10) || 0; 
    }

    if (category === 'wearable' || dpNumber === 0) return 0;

    const slabs = category === 'tablet' ? incentiveSlabs.tab : incentiveSlabs.smartphone;
    const matchedSlab = slabs.find(slab => dpNumber >= slab.min && dpNumber <= slab.max);
    let amount = matchedSlab ? matchedSlab.amount : 0;

    if (category === 'smartphone' && model.seriesGid === '327181163' && amount > 0) {
      const mfList = (incentiveSlabs.mfExceptions || "").split(',').map(s => s.trim().toUpperCase()).filter(s => s); 
      const is100Percent = mfList.some(exc => upperName.includes(exc) || upperCode.includes(exc));
      if (!is100Percent) amount = Math.round(amount / 2); 
    }
    return amount;
  };

  const exportModelsToCSV = () => {
    const dataToExport = searchQuery.trim() !== ''
      ? allModels.filter(m => m.modelName.toLowerCase().includes(searchQuery.toLowerCase()) || m.modelCode.toLowerCase().includes(searchQuery.toLowerCase()))
      : (activeSeries === 'ALL' ? allModels : allModels.filter(m => m.seriesGid === activeSeries));

    if (dataToExport.length === 0) return showNotification("No models available to export!");
    let csvContent = "Model Name,DP,Incentive\n";
    dataToExport.forEach(model => {
      const safeName = `"${model.modelName.replace(/"/g, '""')}"`;
      const safeDp = `"${model.dp ? model.dp.toString().replace(/"/g, '""') : '0'}"`;
      csvContent += `${safeName},${safeDp},${calculateIncentive(model)}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const tabName = activeSeries === 'ALL' ? 'All_Devices' : SHEET_TABS.find(t => t.gid === activeSeries)?.name.replace(/\s+/g, '_') || 'Devices';
    link.download = `SaleBook_${tabName}_${getTodayString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleArrayChange = (category, index, field, value) => {
    if (!draftSlabs) return;
    const newSlabs = { ...draftSlabs };
    newSlabs[category][index][field] = field === 'amount' ? (value === '' ? 0 : parseInt(value, 10)) : value;
    setDraftSlabs(newSlabs);
  };
  const addExceptionRow = (category) => {
    if (!draftSlabs) return;
    const newSlabs = { ...draftSlabs };
    if (!newSlabs[category]) newSlabs[category] = [];
    newSlabs[category].push({ id: `exc_${Date.now()}`, models: '', amount: 0 });
    setDraftSlabs(newSlabs);
  };
  const removeExceptionRow = (category, index) => {
    if (!draftSlabs) return;
    const newSlabs = { ...draftSlabs };
    newSlabs[category].splice(index, 1);
    setDraftSlabs(newSlabs);
  };
  const saveSettingsLocal = () => {
    setIncentiveSlabs(draftSlabs);
    localStorage.setItem('salebook_data_settings', JSON.stringify(draftSlabs));
    showNotification('Settings saved locally!');
  };

  const saveTarget = () => {
    const updatedSlabs = { ...incentiveSlabs };
    if (!updatedSlabs.targets) updatedSlabs.targets = {};
    updatedSlabs.targets[targetForm.month] = {
      volume: targetForm.volume ? parseInt(targetForm.volume, 10) : 0,
      value: targetForm.value ? parseInt(targetForm.value, 10) : 0,
      gate: targetForm.gate ? parseInt(targetForm.gate, 10) : 0,
      gateBasis: targetForm.gateBasis
    };
    setIncentiveSlabs(updatedSlabs);
    setShowTargetModal(false);
  };

  const openTargetEditor = (monthKey) => {
    const existing = incentiveSlabs.targets?.[monthKey] || { volume: '', value: '', gate: '', gateBasis: 'volume' };
    setTargetForm({
      month: monthKey, volume: existing.volume || '', value: existing.value || '', gate: existing.gate || '', gateBasis: existing.gateBasis || 'volume'
    });
    setShowTargetModal(true);
  };

  const openEditSale = (sale) => {
    setSaleForm({ date: sale.date, imei: sale.imei || '', selloutSupport: sale.selloutSupport || '', upgrade: sale.upgrade || '' });
    setSelectedSaleModel({ modelName: sale.modelName, modelCode: sale.modelCode, dp: sale.dp });
    setEditingSaleId(sale.id);
    setIsAddingSale(true);
    setExpandedSaleId(null);
  };

  const saveNewSale = () => {
    if (!selectedSaleModel) return;
    const category = getDeviceCategory(selectedSaleModel); 
    const saleData = {
      modelName: selectedSaleModel.modelName, modelCode: selectedSaleModel.modelCode, dp: selectedSaleModel.dp,
      dpNumber: getDPNumber(selectedSaleModel.dp), incentive: calculateIncentive(selectedSaleModel),
      category: category, 
      date: saleForm.date, imei: saleForm.imei, selloutSupport: Number(saleForm.selloutSupport) || 0,
      upgrade: Number(saleForm.upgrade) || 0, timestamp: editingSaleId ? sales.find(s => s.id === editingSaleId)?.timestamp || Date.now() : Date.now()
    };
    let updatedSales = editingSaleId ? sales.map(s => s.id === editingSaleId ? { ...s, ...saleData } : s) : [{ id: Date.now().toString(), ...saleData }, ...sales];
    updatedSales.sort((a, b) => b.timestamp - a.timestamp);
    setSales(updatedSales);
    
    const saleMonthKey = saleForm.date.substring(0, 7);
    setSelectedMonth(saleMonthKey);

    setSaleForm({ date: getTodayString(), imei: '', selloutSupport: '', upgrade: '' });
    setSelectedSaleModel(null);
    setSaleModelQuery('');
    setIsAddingSale(false);
    setEditingSaleId(null);
  };

  const confirmDelete = () => {
    if (!saleToDelete) return;
    setSales(sales.filter(s => s.id !== saleToDelete));
    setSaleToDelete(null); 
  };

  const handleBackup = () => {
    try {
      const backupData = { sales: sales, settings: incentiveSlabs, timestamp: Date.now() };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `SaleBook_Backup_${getTodayString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Backup downloaded!');
    } catch (error) { showNotification('Backup failed!'); }
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (parsedData && Array.isArray(parsedData.sales) && typeof parsedData.settings === 'object') {
          setBackupDataToRestore(parsedData);
        } else {
          showNotification("Invalid Backup format. File is corrupted.");
        }
      } catch (err) { 
        showNotification("File read error. Ensure it is a valid JSON."); 
      } 
      finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (!backupDataToRestore) return;
    setIsRestoring(true);
    setTimeout(() => {
      try {
        const restoredSettings = {
          ...DEFAULT_SLABS,
          ...backupDataToRestore.settings,
          targets: backupDataToRestore.settings.targets || {},
          smartphoneExceptions: backupDataToRestore.settings.smartphoneExceptions || [],
          tabExceptions: backupDataToRestore.settings.tabExceptions || [],
          wearableExceptions: backupDataToRestore.settings.wearableExceptions || DEFAULT_SLABS.wearableExceptions,
        };

        setIncentiveSlabs(restoredSettings);
        setSales(backupDataToRestore.sales || []);
        
        showNotification(`Restored ${backupDataToRestore.sales.length} sales successfully!`);
        setActiveBottomTab('dashboard');
      } catch (err) { 
        showNotification("Restore failed."); 
      } 
      finally { 
        setIsRestoring(false); 
        setBackupDataToRestore(null); 
      }
    }, 600);
  };

  useEffect(() => {
    if (searchQuery.trim() !== '' && activeBottomTab === 'models' && activeSeries !== 'ALL') {
      setActiveSeries('ALL');
      setTimeout(() => document.getElementById('tab-ALL')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }), 50);
    }
  }, [searchQuery, activeBottomTab, activeSeries]);

  const filteredModels = searchQuery.trim() !== ''
    ? allModels.filter(m => m.modelName.toLowerCase().includes(searchQuery.toLowerCase()) || m.modelCode.toLowerCase().includes(searchQuery.toLowerCase()))
    : (activeSeries === 'ALL' ? allModels : allModels.filter(m => m.seriesGid === activeSeries));

  // ==========================================
  // BUSINESS CALCULATIONS (BASED ON SELECTED MONTH)
  // ==========================================
  
  const getAvailableMonths = () => {
    const monthSet = new Set(sales.map(s => s.date.substring(0, 7)));
    monthSet.add(getCurrentMonthKey()); 
    return Array.from(monthSet).sort().reverse(); 
  };
  const availableMonths = getAvailableMonths();

  const filteredSalesByMonth = sales.filter(s => s.date.startsWith(selectedMonth));

  const getSaleCategory = (sale) => sale.category || getDeviceCategory(sale);

  const totalIncThisMonth = filteredSalesByMonth.reduce((sum, sale) => sum + (sale.incentive || 0), 0);
  const totalSalesThisMonth = filteredSalesByMonth.length;
  const totalRevThisMonth = filteredSalesByMonth.reduce((sum, sale) => sum + (sale.dpNumber || 0), 0);

  const smartphoneIncThisMonth = filteredSalesByMonth.filter(s => getSaleCategory(s) === 'smartphone').reduce((sum, s) => sum + (s.incentive || 0), 0);
  const tabletIncThisMonth = filteredSalesByMonth.filter(s => getSaleCategory(s) === 'tablet').reduce((sum, s) => sum + (s.incentive || 0), 0);
  const wearableIncThisMonth = filteredSalesByMonth.filter(s => getSaleCategory(s) === 'wearable').reduce((sum, s) => sum + (s.incentive || 0), 0);

  const smartphoneSalesThisMonth = filteredSalesByMonth.filter(sale => getSaleCategory(sale) === 'smartphone');
  const smartphoneVolThisMonth = smartphoneSalesThisMonth.length;
  const smartphoneRevThisMonth = smartphoneSalesThisMonth.reduce((sum, sale) => sum + (sale.dpNumber || 0), 0);

  const currentMonthTarget = incentiveSlabs.targets?.[selectedMonth] || null;
  let isGateMet = true;
  let volAchievedPercent = 0; let valAchievedPercent = 0;
  let volBalanceToGate = 0; let valBalanceToGate = 0;
  let volBalanceTo100 = 0; let valBalanceTo100 = 0;

  if (currentMonthTarget) {
    if (currentMonthTarget.volume > 0) {
      volAchievedPercent = Math.min(100, Math.round((smartphoneVolThisMonth / currentMonthTarget.volume) * 100));
      const volTargetGateUnits = Math.ceil(currentMonthTarget.volume * (currentMonthTarget.gate / 100));
      volBalanceToGate = Math.max(0, volTargetGateUnits - smartphoneVolThisMonth);
      volBalanceTo100 = Math.max(0, currentMonthTarget.volume - smartphoneVolThisMonth);
    }
    if (currentMonthTarget.value > 0) {
      valAchievedPercent = Math.min(100, Math.round((smartphoneRevThisMonth / currentMonthTarget.value) * 100));
      const valTargetGateAmt = Math.ceil(currentMonthTarget.value * (currentMonthTarget.gate / 100));
      valBalanceToGate = Math.max(0, valTargetGateAmt - smartphoneRevThisMonth);
      valBalanceTo100 = Math.max(0, currentMonthTarget.value - smartphoneRevThisMonth);
    }
    if (currentMonthTarget.gate > 0) {
      const volMet = currentMonthTarget.volume > 0 ? volAchievedPercent >= currentMonthTarget.gate : false;
      const valMet = currentMonthTarget.value > 0 ? valAchievedPercent >= currentMonthTarget.gate : false;
      if (currentMonthTarget.gateBasis === 'volume') isGateMet = volMet;
      else if (currentMonthTarget.gateBasis === 'value') isGateMet = valMet;
      else if (currentMonthTarget.gateBasis === 'either') isGateMet = volMet || valMet;
      else if (currentMonthTarget.gateBasis === 'both') isGateMet = volMet && valMet;
    }
  }

  let volBalanceText = null;
  if (currentMonthTarget && currentMonthTarget.volume > 0) {
    if (currentMonthTarget.gate > 0 && ['volume', 'either', 'both'].includes(currentMonthTarget.gateBasis) && !isGateMet && volAchievedPercent < currentMonthTarget.gate) {
      volBalanceText = `Gate Bal: ${volBalanceToGate} U`;
    } else if (volAchievedPercent < 100) {
      volBalanceText = `100% Bal: ${volBalanceTo100} U`;
    } else {
      volBalanceText = `Achieved!`;
    }
  }

  let valBalanceText = null;
  if (currentMonthTarget && currentMonthTarget.value > 0) {
    if (currentMonthTarget.gate > 0 && ['value', 'either', 'both'].includes(currentMonthTarget.gateBasis) && !isGateMet && valAchievedPercent < currentMonthTarget.gate) {
      valBalanceText = `Gate Bal: ${formatMoney(valBalanceToGate)}`;
    } else if (valAchievedPercent < 100) {
      valBalanceText = `100% Bal: ${formatMoney(valBalanceTo100)}`;
    } else {
      valBalanceText = `Achieved!`;
    }
  }

  const getGateBasisText = (basis) => {
    if (basis === 'volume') return 'Vol Only';
    if (basis === 'value') return 'Val Only';
    if (basis === 'either') return 'Vol/Val';
    if (basis === 'both') return 'Vol & Val';
    return '';
  };

  const groupedSales = filteredSalesByMonth.reduce((acc, sale) => {
    if (!acc[sale.date]) acc[sale.date] = { date: sale.date, sales: [], volume: 0, value: 0 };
    acc[sale.date].sales.push(sale);
    acc[sale.date].volume += 1;
    acc[sale.date].value += sale.dpNumber || 0;
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedSales).sort((a, b) => new Date(b) - new Date(a));

  const groupedByModel = filteredSalesByMonth.reduce((acc, sale) => {
    if(!acc[sale.modelName]) {
      acc[sale.modelName] = { count: 0, incentive: 0, modelCode: sale.modelCode, dp: sale.dpNumber, category: getSaleCategory(sale) };
    }
    acc[sale.modelName].count += 1;
    acc[sale.modelName].incentive += (sale.incentive || 0);
    return acc;
  }, {});
  const sortedModels = Object.entries(groupedByModel).sort((a, b) => b[1].count - a[1].count);

  // ==========================================
  // LIQUID GLASS + DARK MESH UI THEME 
  // ==========================================
  
  const glassCard = "bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full min-w-0";
  const glassCardInner = "bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] w-full min-w-0";
  const glassInput = "w-full min-w-0 bg-black/20 backdrop-blur-md border border-white/10 rounded-[16px] px-4 py-3 sm:px-5 sm:py-3.5 text-[13px] sm:text-[14px] font-medium text-white focus:outline-none focus:bg-black/40 focus:border-white/30 placeholder-white/40 transition-all duration-300";
  const solidButton = "w-full py-3.5 sm:py-4 bg-white text-black rounded-[20px] font-bold text-[14px] sm:text-[15px] hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 shrink-0";

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-[100vw] bg-[#050505] text-white/90 font-sans selection:bg-white/30 relative overflow-hidden">
      
      {/* STRICT BACKGROUND WRAPPER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 6px 6px',
          backgroundPosition: '0 0, 0 0'
        }}></div>
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="flex flex-col h-full w-full relative z-10">
        {/* TAB 1: DASHBOARD */}
        {activeBottomTab === 'dashboard' && !isAddingSale && (
          <div className="flex flex-col h-full z-10 w-full overflow-hidden">
            <div className="pt-6 pb-4 px-4 sm:px-5 shrink-0">
              <header className="flex items-center justify-between mb-4 sm:mb-5">
                <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white drop-shadow-sm truncate pr-2">SaleBook</h1>
                
                {/* MONTH FILTER DROPDOWN */}
                <div className="relative flex items-center shrink-0">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-white/10 backdrop-blur-md text-white font-bold text-[11px] sm:text-[12px] px-3.5 py-2 pr-8 rounded-full border border-white/20 focus:outline-none focus:bg-white/20 transition-colors shadow-sm cursor-pointer"
                  >
                    {availableMonths.map(monthStr => (
                      <option key={monthStr} value={monthStr} className="bg-[#111] text-white py-1">
                        {formatMonthLabel(monthStr)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-3 pointer-events-none" strokeWidth={2.5}/>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                <div className={`${glassCard} p-3 sm:p-4.5 flex flex-col items-center justify-center relative overflow-hidden text-center`}>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white/60 uppercase tracking-widest mb-1 sm:mb-1.5 w-full truncate">Total Value</span>
                  <span className="text-[14px] sm:text-[16px] font-bold drop-shadow-md w-full truncate">{formatMoney(totalRevThisMonth)}</span>
                </div>
                <div className={`${glassCard} p-3 sm:p-4.5 flex flex-col items-center justify-center relative overflow-hidden text-center`}>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white/60 uppercase tracking-widest mb-1 sm:mb-1.5 w-full truncate">Total Vol</span>
                  <span className="text-[14px] sm:text-[16px] font-bold drop-shadow-md w-full truncate">{totalSalesThisMonth} <span className="text-[9px] sm:text-[10px] font-medium text-white/60">U</span></span>
                </div>
                <div className={`${glassCard} p-3 sm:p-4.5 flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden text-center`}>
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 w-full">
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest truncate ${!isGateMet ? 'text-white/40' : 'text-white/60'}`}>Inc.</span>
                    <button onClick={() => setShowIncentive(!showIncentive)} className="p-0.5 rounded-full text-white/60 hover:text-white transition-colors active:scale-90 shrink-0">
                      {showIncentive ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2} />}
                    </button>
                  </div>
                  <span className={`text-[14px] sm:text-[16px] font-bold drop-shadow-md flex items-center justify-center gap-1 sm:gap-1.5 w-full ${!isGateMet ? 'text-white/50' : 'text-white'}`}>
                    {!isGateMet && <Lock className="w-3 h-3 opacity-60 strokeWidth={2} shrink-0" />}
                    <span className="truncate">{showIncentive ? formatMoney(totalIncThisMonth) : '₹ ••••'}</span>
                  </span>
                </div>
              </div>

              {/* CATEGORY BREAKDOWN ROW */}
              <div className={`grid grid-cols-3 gap-2 sm:gap-3 w-full transition-all duration-500 ease-in-out overflow-hidden ${showIncentive ? 'max-h-20 opacity-100 mt-2 sm:mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className={`${glassCardInner} p-2.5 sm:p-3 flex items-center justify-center gap-2`}>
                  <Smartphone className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-white/50 font-bold truncate">Phone</span>
                    <span className={`text-[11px] sm:text-[12.5px] font-bold ${!isGateMet ? 'text-white/40' : 'text-white'}`}>{formatMoney(smartphoneIncThisMonth)}</span>
                  </div>
                </div>
                <div className={`${glassCardInner} p-2.5 sm:p-3 flex items-center justify-center gap-2`}>
                  <LayoutDashboard className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-white/50 font-bold truncate">Tablet</span>
                    <span className="text-[11px] sm:text-[12.5px] font-bold text-white">{formatMoney(tabletIncThisMonth)}</span>
                  </div>
                </div>
                <div className={`${glassCardInner} p-2.5 sm:p-3 flex items-center justify-center gap-2`}>
                  <Watch className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-white/50 font-bold truncate">Wearable</span>
                    <span className="text-[11px] sm:text-[12.5px] font-bold text-white">{formatMoney(wearableIncThisMonth)}</span>
                  </div>
                </div>
              </div>

            </div>

            <main className="flex-1 overflow-y-auto pb-32 px-4 sm:px-5 hide-scrollbar w-full">
              {/* TARGET PROGRESS CARD */}
              <div className={`mb-5 sm:mb-6 ${glassCard} overflow-hidden transition-all duration-500 ease-in-out`}>
                <div className="p-4 sm:p-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsTargetExpanded(!isTargetExpanded)}>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-[11px] sm:text-[13px] font-bold uppercase tracking-widest flex items-center drop-shadow-sm truncate pr-2">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-cyan-400 shrink-0" strokeWidth={2}/> Smartphone Target
                    </h3>
                    <div className={`p-1.5 rounded-full bg-white/10 border border-white/20 transition-transform duration-300 shrink-0 ${isTargetExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-3.5 h-3.5 text-white/80" strokeWidth={2} />
                    </div>
                  </div>

                  {!currentMonthTarget ? (
                    <p className="text-[11px] sm:text-[12px] text-white/60 mt-2 sm:mt-3 font-medium truncate">Target not set for this month.</p>
                  ) : (
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isTargetExpanded ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100 mt-3 sm:mt-4'}`}>
                      <div className="flex flex-col gap-2.5 sm:gap-3.5">
                        {currentMonthTarget.volume > 0 && (
                          <div className="h-[3px] sm:h-[4px] w-full bg-black/30 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${volAchievedPercent}%` }}></div>
                          </div>
                        )}
                        {currentMonthTarget.value > 0 && (
                          <div className="h-[3px] sm:h-[4px] w-full bg-black/30 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${valAchievedPercent}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Target Details */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isTargetExpanded ? 'max-h-[600px] opacity-100 border-t border-white/10 bg-black/20' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    {!currentMonthTarget ? (
                      <div className="bg-black/20 border border-white/10 border-dashed rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 text-center flex flex-col items-center justify-center">
                        <p className="text-[12px] sm:text-[13px] text-white/70 mb-3 sm:mb-4 font-medium">Target for this month is not set.</p>
                        <button onClick={() => openTargetEditor(selectedMonth)} className="text-[12px] sm:text-[13px] font-bold bg-white text-black px-5 sm:px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg shrink-0">Set Target</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:gap-4 w-full">
                        {currentMonthTarget.volume > 0 && (
                          <div className={`${glassCardInner} p-4 sm:p-4.5 flex flex-col w-full overflow-hidden`}>
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold mb-2.5 sm:mb-3 drop-shadow-sm w-full">
                              <span className="uppercase tracking-widest flex items-center shrink-0 pr-2"><Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 opacity-90 shrink-0" strokeWidth={2}/> SP Volume</span>
                              <span className="truncate min-w-0">{smartphoneVolThisMonth} / {currentMonthTarget.volume} <span className="text-white/60 ml-0.5 sm:ml-1 font-medium">({volAchievedPercent}%)</span></span>
                            </div>
                            <div className="h-[3px] sm:h-[4px] w-full bg-black/30 rounded-full overflow-hidden mb-2.5 sm:mb-3 shrink-0 shadow-inner">
                              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${volAchievedPercent}%` }}></div>
                            </div>
                            <div className="text-[9.5px] sm:text-[10.5px] font-medium flex items-center justify-between gap-2 text-white/70 w-full">
                              <span className="truncate pr-2 min-w-0">{volBalanceText}</span>
                              {volAchievedPercent >= 100 && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" strokeWidth={2.5} />}
                            </div>
                          </div>
                        )}

                        {currentMonthTarget.value > 0 && (
                          <div className={`${glassCardInner} p-4 sm:p-4.5 flex flex-col w-full overflow-hidden`}>
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold mb-2.5 sm:mb-3 drop-shadow-sm w-full">
                              <span className="uppercase tracking-widest flex items-center shrink-0 pr-2"><Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 opacity-90 shrink-0" strokeWidth={2}/> SP Value</span>
                              <span className="truncate min-w-0">{formatMoney(smartphoneRevThisMonth)} / {formatMoney(currentMonthTarget.value)} <span className="text-white/60 ml-0.5 sm:ml-1 font-medium">({valAchievedPercent}%)</span></span>
                            </div>
                            <div className="h-[3px] sm:h-[4px] w-full bg-black/30 rounded-full overflow-hidden mb-2.5 sm:mb-3 shrink-0 shadow-inner">
                              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${valAchievedPercent}%` }}></div>
                            </div>
                            <div className="text-[9.5px] sm:text-[10.5px] font-medium flex items-center justify-between gap-2 text-white/70 w-full">
                              <span className="truncate pr-2 min-w-0">{valBalanceText}</span>
                              {valAchievedPercent >= 100 && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" strokeWidth={2.5} />}
                            </div>
                          </div>
                        )}

                        <div className="mt-1 flex items-center justify-between gap-2.5 sm:gap-3 w-full">
                          {currentMonthTarget.gate > 0 ? (
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-full border shrink-0 flex items-center justify-center ${isGateMet ? 'bg-white/20 border-white/40' : 'bg-black/20 border-white/10 text-white/50'}`}>
                                {isGateMet ? <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2} /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2} />}
                              </div>
                              <div className="flex flex-col justify-center flex-1 min-w-0">
                                <span className={`text-[11px] sm:text-[13px] font-bold truncate w-full drop-shadow-sm ${isGateMet ? 'text-white' : 'text-white/60'}`}>
                                   {isGateMet ? 'Payout Unlocked' : 'Payout Locked'}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-white/60 mt-0.5 leading-tight font-medium truncate w-full">
                                  {isGateMet ? `Gate ${currentMonthTarget.gate}% achieved.` : `Need ${currentMonthTarget.gate}% in ${getGateBasisText(currentMonthTarget.gateBasis)}.`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0"></div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openTargetEditor(selectedMonth); }} className="text-[10px] sm:text-[11px] font-bold bg-white/10 border border-white/20 hover:bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 transition-colors shadow-sm shrink-0">
                            <Edit2 className="w-3 h-3 shrink-0" strokeWidth={2}/> Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOGGLE HEADER FOR SALES HISTORY */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-2 w-full">
                <h2 className="text-[10px] sm:text-[11px] font-bold text-white/70 uppercase tracking-widest drop-shadow-sm">
                  Sales History
                </h2>
                
                <div className="flex items-center bg-black/30 p-1 rounded-full border border-white/10">
                  <button 
                    onClick={() => setHistoryViewMode('date')} 
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold transition-colors ${historyViewMode === 'date' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                  >
                    <List className="w-3 h-3" /> Date
                  </button>
                  <button 
                    onClick={() => setHistoryViewMode('model')} 
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold transition-colors ${historyViewMode === 'model' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                  >
                    <BarChart3 className="w-3 h-3" /> Model
                  </button>
                </div>
              </div>
              
              {filteredSalesByMonth.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-10 sm:py-12 text-white/50 ${glassCard}`}>
                  <Tag className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 opacity-40 shrink-0" strokeWidth={1.5} />
                  <p className="text-[12px] sm:text-[13px] font-medium">No sales recorded for this month.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4 w-full">
                  
                  {/* VIEW MODE: DATE */}
                  {historyViewMode === 'date' && sortedDates.map(dateKey => {
                    const group = groupedSales[dateKey];
                    const formattedDate = new Date(dateKey).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                    return (
                      <div key={dateKey} className={`${glassCard} overflow-hidden w-full flex flex-col`}>
                        <div className="flex items-center justify-between bg-white/5 px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 w-full">
                          <span className="text-[12px] sm:text-[13px] font-bold text-white/90 truncate pr-2 drop-shadow-sm">{formattedDate}</span>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/80 border border-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/20 shrink-0">
                              {group.volume} Unit{group.volume > 1 ? 's' : ''}
                            </span>
                            <span className="text-[13px] sm:text-[14px] font-bold text-white drop-shadow-sm shrink-0">{formatMoney(group.value)}</span>
                          </div>
                        </div>
                        <div className="divide-y divide-white/5 w-full flex flex-col">
                          {group.sales.map((sale) => (
                            <div key={sale.id} className="flex flex-col w-full">
                              <div onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)} className="flex items-center justify-between px-4 sm:px-5 py-4 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors w-full gap-2">
                                <span className="text-[13px] sm:text-[14px] font-bold text-white truncate min-w-0 flex-1 drop-shadow-sm">{sale.modelName}</span>
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                  <span className="text-[13px] sm:text-[14px] font-bold text-white/80 shrink-0">{formatMoney(sale.dpNumber)}</span>
                                  <div className={`transition-transform duration-300 p-1.5 sm:p-1.5 rounded-full bg-white/10 shrink-0 ${expandedSaleId === sale.id ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 shrink-0" strokeWidth={2} />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Expandable Inner Area */}
                              <div className={`transition-all duration-400 ease-in-out overflow-hidden bg-black/20 w-full flex flex-col ${expandedSaleId === sale.id ? 'max-h-[400px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 w-full">
                                  <div className="flex items-start justify-between gap-2 w-full">
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-[8.5px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1 truncate">IMEI Number</span>
                                      <span className="text-[12px] sm:text-[13px] text-white/90 font-medium break-words min-w-0 can-select">{sale.imei || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className="text-[8.5px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1 truncate">Incentive</span>
                                      <span className={`text-[13px] sm:text-[14px] font-bold flex items-center shrink-0 ${getSaleCategory(sale) === 'smartphone' && !isGateMet ? 'text-white/40' : 'text-white drop-shadow-md'}`}>
                                        {getSaleCategory(sale) === 'smartphone' && !isGateMet && <Lock className="w-3 h-3 opacity-60 strokeWidth={2} shrink-0 mr-1" />} +₹{sale.incentive}
                                      </span>
                                    </div>
                                  </div>
                                  {(sale.selloutSupport > 0 || sale.upgrade > 0) && (
                                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                                      {sale.selloutSupport > 0 && (
                                        <div className={`${glassCardInner} px-3.5 py-2 sm:px-4 sm:py-3 flex-1 min-w-0 overflow-hidden`}>
                                          <span className="text-[8.5px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5 truncate block">Sellout</span>
                                          <span className="text-[12px] sm:text-[13px] font-bold text-white truncate block">₹{sale.selloutSupport}</span>
                                        </div>
                                      )}
                                      {sale.upgrade > 0 && (
                                        <div className={`${glassCardInner} px-3.5 py-2 sm:px-4 sm:py-3 flex-1 min-w-0 overflow-hidden`}>
                                          <span className="text-[8.5px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5 truncate block">Upgrade</span>
                                          <span className="text-[12px] sm:text-[13px] font-bold text-white truncate block">₹{sale.upgrade}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10 w-full shrink-0">
                                    <button onClick={() => openEditSale(sale)} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-[10px] sm:text-[11px] font-bold transition-colors shrink-0">
                                      <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" strokeWidth={2} /> Edit
                                    </button>
                                    <button onClick={() => setSaleToDelete(sale.id)} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-white bg-red-500/20 hover:bg-red-500/40 rounded-full border border-red-500/30 text-[10px] sm:text-[11px] font-bold transition-colors shrink-0">
                                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" strokeWidth={2} /> Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* VIEW MODE: MODEL */}
                  {historyViewMode === 'model' && (
                    <div className={`${glassCard} overflow-hidden w-full flex flex-col pb-2`}>
                      <div className="flex items-center justify-between bg-white/5 px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 w-full mb-2">
                        <span className="text-[12px] sm:text-[13px] font-bold text-white/90 truncate pr-2 drop-shadow-sm">Models Summary</span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-white/70">{sortedModels.length} Models</span>
                      </div>
                      <div className="flex flex-col w-full">
                        {sortedModels.map(([modelName, data], idx) => (
                          <div key={modelName} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors w-full gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 text-[11px] sm:text-[12px] font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] sm:text-[14px] font-bold text-white truncate drop-shadow-sm">{modelName}</span>
                                {showIncentive && data.incentive > 0 && (
                                  <span className="text-[9.5px] sm:text-[10px] font-bold text-cyan-400 mt-0.5 truncate">
                                    Inc: +₹{data.incentive}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center shrink-0">
                              <span className="text-[14px] sm:text-[15px] font-extrabold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/20 shadow-inner">
                                {data.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </main>
            
            {/* DASHBOARD FLOATING ACTION BUTTON */}
            <div className="fixed bottom-[90px] sm:bottom-[100px] right-5 sm:right-6 z-40 shrink-0">
              <button onClick={() => { setIsAddingSale(true); setEditingSaleId(null); setSaleForm({ date: getTodayString(), imei: '', selloutSupport: '', upgrade: '' }); setSelectedSaleModel(null); }} 
                      className="bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] rounded-[20px] sm:rounded-[24px] w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all duration-300">
                <Plus className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* TARGET MODAL */}
        {showTargetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 w-full h-full overflow-hidden">
            <div className={`w-full max-w-[400px] ${glassCard} border-white/30 p-6 sm:p-7 animate-in fade-in zoom-in duration-300 flex flex-col shrink-0`}>
              <div className="flex items-center justify-between mb-6 w-full shrink-0">
                <h3 className="text-[16px] sm:text-[18px] font-bold text-white drop-shadow-md truncate">Set Target</h3>
                <button onClick={() => setShowTargetModal(false)} className="p-1.5 sm:p-2 bg-white/10 border border-white/20 text-white/70 rounded-full hover:text-white hover:bg-white/20 transition-colors shrink-0"><X className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" strokeWidth={2}/></button>
              </div>
              
              <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8 w-full shrink-0 overflow-y-auto hide-scrollbar max-h-[60vh] sm:max-h-[70vh]">
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5 sm:mb-2">Target Month</label>
                  <input type="month" value={targetForm.month} onChange={(e) => setTargetForm({...targetForm, month: e.target.value})} className={glassInput + ' [color-scheme:dark] shrink-0'} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center truncate"><Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 opacity-80 shrink-0"/> SP Vol (Units)</label>
                    <input type="number" placeholder="0" value={targetForm.volume} onChange={(e) => setTargetForm({...targetForm, volume: e.target.value})} className={glassInput} />
                  </div>
                  <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center truncate"><Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 opacity-80 shrink-0"/> SP Value (₹)</label>
                    <input type="number" placeholder="0" value={targetForm.value} onChange={(e) => setTargetForm({...targetForm, value: e.target.value})} className={glassInput} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-[20px] p-4 sm:p-5 w-full shrink-0 relative overflow-hidden shadow-inner mt-1">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-4 sm:mb-5">
                    <div className="p-2 sm:p-2.5 rounded-full bg-white/10 border border-white/20 shrink-0 shadow-sm">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] sm:text-[12px] font-bold text-white uppercase tracking-widest leading-tight">Payout Gate Rule</label>
                      <span className="text-[9px] sm:text-[10px] text-white/60 font-medium">Condition to unlock incentives</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full bg-black/30 p-1.5 rounded-[16px] border border-white/10">
                    <div className="flex items-center gap-2 w-full p-2">
                      <span className="text-[11px] sm:text-[12px] font-bold text-white/70 shrink-0 w-[60px] pl-1">Require</span>
                      <div className="relative flex-1">
                        <input type="number" placeholder="0" value={targetForm.gate} onChange={(e) => setTargetForm({...targetForm, gate: e.target.value})} className={`${glassInput} pl-4 pr-8 py-2 text-center text-[13px] font-bold bg-white/5 border-white/10`} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-[12px] font-bold">%</span>
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-white/5 my-0.5"></div>

                    <div className="flex items-center gap-2 w-full p-2">
                      <span className="text-[11px] sm:text-[12px] font-bold text-white/70 shrink-0 w-[60px] pl-1">Target in</span>
                      <select value={targetForm.gateBasis} onChange={(e) => setTargetForm({...targetForm, gateBasis: e.target.value})} className={`${glassInput} py-2.5 text-[12px] font-bold [color-scheme:dark] flex-1 bg-white/5 border-white/10`}>
                        <option value="volume">Volume Only</option>
                        <option value="value">Value Only</option>
                        <option value="either">Either (Vol or Val)</option>
                        <option value="both">Both (Vol & Val)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={saveTarget} className={solidButton}>Save Targets</button>
            </div>
          </div>
        )}

        {saleToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 w-full h-full overflow-hidden">
            <div className={`${glassCard} p-6 sm:p-7 w-[calc(100vw-2rem)] max-w-[320px] flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 shrink-0 border-white/40`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mb-5 shrink-0 shadow-inner">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2} />
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-white mb-2 w-full truncate drop-shadow-md">Delete Sale?</h3>
              <p className="text-[11px] sm:text-[13px] text-white/70 mb-6 sm:mb-8 font-medium w-full">This action cannot be undone.</p>
              <div className="flex items-center gap-3 w-full shrink-0">
                <button onClick={() => setSaleToDelete(null)} className="flex-1 min-w-0 py-3 sm:py-3.5 rounded-full font-bold text-[12px] sm:text-[13px] text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors truncate px-1">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 min-w-0 py-3 sm:py-3.5 rounded-full font-bold text-[12px] sm:text-[13px] text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg truncate px-1">Delete</button>
              </div>
            </div>
          </div>
        )}

        {backupDataToRestore && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 w-full h-full overflow-hidden">
            <div className={`${glassCard} p-6 sm:p-7 w-[calc(100vw-2rem)] max-w-[320px] flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 shrink-0 border-white/40`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 text-white/80 rounded-full flex items-center justify-center mb-5 shrink-0 shadow-inner">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2} />
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-white mb-2 w-full truncate drop-shadow-md">Restore Backup?</h3>
              <p className="text-[11px] sm:text-[13px] text-white/70 mb-6 sm:mb-8 font-medium leading-relaxed w-full">Current local data will be replaced.</p>
              <div className="flex items-center gap-3 w-full shrink-0">
                <button onClick={() => setBackupDataToRestore(null)} disabled={isRestoring} className="flex-1 min-w-0 py-3 sm:py-3.5 rounded-full font-bold text-[12px] sm:text-[13px] text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50 truncate px-1">Cancel</button>
                <button onClick={confirmRestore} disabled={isRestoring} className="flex-1 min-w-0 flex justify-center items-center py-3 sm:py-3.5 rounded-full font-bold text-[12px] sm:text-[13px] text-black bg-white hover:bg-white/90 transition-colors disabled:opacity-50 shadow-lg truncate px-1">
                  {isRestoring ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: ADD/EDIT SALE FORM */}
        {activeBottomTab === 'dashboard' && isAddingSale && (
          <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl z-50 absolute inset-0 w-full overflow-hidden">
            <header className="bg-transparent px-4 sm:px-5 pt-8 sm:pt-10 pb-4 sm:pb-5 flex items-center justify-between w-full shrink-0 border-b border-white/10">
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <button onClick={() => { setIsAddingSale(false); setEditingSaleId(null); }} className="p-2 sm:p-2.5 -ml-1 sm:-ml-2 text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-full transition-colors shrink-0"><ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" strokeWidth={2}/></button>
                <h1 className="text-[18px] sm:text-[20px] font-bold text-white truncate drop-shadow-md">{editingSaleId ? 'Edit Sale' : 'Record Sale'}</h1>
              </div>
              <button onClick={saveNewSale} disabled={!selectedSaleModel} className={`text-[13px] sm:text-[14px] font-bold px-5 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shrink-0 shadow-lg ${selectedSaleModel ? 'text-black bg-white hover:bg-white/90' : 'text-white/40 bg-white/5 border border-white/10 shadow-none'}`}>Save</button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-5 pb-10 hide-scrollbar w-full flex flex-col gap-4 sm:gap-5">
              
              {/* CARD 1: MODEL & DATE (Highest z-index so dropdown stays on top) */}
              <div className={`${glassCard} p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 w-full relative z-[60]`}>
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center truncate"><Calendar className="w-3.5 h-3.5 mr-1.5 opacity-80 shrink-0" strokeWidth={2}/> Sale Date</label>
                  <input type="date" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} className={`${glassInput} [color-scheme:dark] shrink-0`} />
                </div>

                <div className="flex flex-col relative w-full">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center truncate"><Smartphone className="w-3.5 h-3.5 mr-1.5 opacity-80 shrink-0" strokeWidth={2}/> Model Name</label>
                  {selectedSaleModel ? (
                    <div className="flex items-center justify-between bg-white/10 border border-white/30 rounded-[16px] px-4 sm:px-5 py-3 sm:py-4 w-full overflow-hidden gap-2 shadow-inner">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1 truncate">{selectedSaleModel.modelCode}</span>
                        <span className="text-[14px] sm:text-[15px] font-bold text-white truncate drop-shadow-sm">{selectedSaleModel.modelName}</span>
                      </div>
                      <button onClick={() => { setSelectedSaleModel(null); setSaleModelQuery(''); }} className="p-2 sm:p-2.5 bg-black/20 border border-white/20 text-white/70 rounded-full hover:text-white hover:bg-black/40 transition-colors shrink-0"><X className="w-4 h-4 shrink-0" strokeWidth={2}/></button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col relative">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 absolute left-4 sm:left-4.5 top-3.5 sm:top-4 text-white/50 shrink-0" strokeWidth={2}/>
                        <input type="text" placeholder="Search model..." value={saleModelQuery} onChange={(e) => setSaleModelQuery(e.target.value)} className={`${glassInput} pl-11 sm:pl-12`} />
                      </div>
                      {saleModelQuery.trim() !== '' && (
                        <div className="mt-2 bg-[#1a1a1a] border border-white/20 rounded-[20px] sm:rounded-[24px] max-h-[200px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,1)] absolute w-full z-[100] top-full hide-scrollbar flex flex-col">
                          {allModels.filter(m => m.modelName.toLowerCase().includes(saleModelQuery.toLowerCase()) || m.modelCode.toLowerCase().includes(saleModelQuery.toLowerCase())).slice(0, 15).map(m => (
                            <div key={m.id} onClick={() => setSelectedSaleModel(m)} className="flex items-center justify-between p-4 sm:p-4.5 border-b border-white/10 hover:bg-white/10 cursor-pointer transition-colors w-full gap-2">
                              <div className="flex flex-col min-w-0 flex-1"><span className="text-[13px] sm:text-[14px] font-bold text-white mb-1 truncate drop-shadow-sm">{m.modelName}</span><span className="text-[9px] sm:text-[10px] font-medium text-white/60 truncate">{m.modelCode}</span></div>
                              <span className="text-[11px] sm:text-[13px] font-bold text-white/80 shrink-0">{m.dp ? (m.dp.toString().includes('₹') ? m.dp : `₹${m.dp}`) : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: PRICE & INC (Lower z-index) */}
              <div className={`${glassCard} p-5 sm:p-6 transition-all duration-300 w-full relative z-[50] ${!selectedSaleModel ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full">
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 truncate">Dealer Price</span>
                    <div className="bg-black/20 px-4 sm:px-5 py-3 sm:py-4 rounded-[16px] sm:rounded-[18px] border border-white/20 text-[14px] sm:text-[16px] font-bold text-white truncate w-full shadow-inner">
                      {selectedSaleModel ? (selectedSaleModel.dp.toString().includes('₹') ? selectedSaleModel.dp : `₹${selectedSaleModel.dp}`) : '₹0'}
                    </div>
                  </div>
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 truncate">Incentive</span>
                    <div className="bg-white/20 px-4 sm:px-5 py-3 sm:py-4 rounded-[16px] sm:rounded-[18px] border border-white/40 text-[14px] sm:text-[16px] font-bold text-white flex items-center truncate w-full shadow-inner">
                      <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1.5 sm:mr-2 text-white shrink-0" strokeWidth={2.5} />₹{selectedSaleModel ? calculateIncentive(selectedSaleModel) : '0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: IMEI & EXTRAS (Lowest z-index) */}
              <div className={`${glassCard} p-5 sm:p-6 w-full flex flex-col gap-5 sm:gap-6 relative z-[40]`}>
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 flex items-center truncate"><ScanLine className="w-3.5 h-3.5 mr-2 opacity-80 shrink-0" strokeWidth={2}/> IMEI Number</label>
                  <input type="text" placeholder="Enter or scan IMEI" value={saleForm.imei} onChange={(e) => setSaleForm({...saleForm, imei: e.target.value})} className={`${glassInput} uppercase`} />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full">
                  <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 truncate">Sellout</label>
                    <div className="relative w-full flex items-center">
                      <span className="absolute left-4 top-3.5 sm:top-4 text-[13px] sm:text-[14px] font-medium text-white/60 shrink-0">₹</span>
                      <input type="number" placeholder="0" value={saleForm.selloutSupport} onChange={(e) => setSaleForm({...saleForm, selloutSupport: e.target.value})} className={`${glassInput} pl-8 sm:pl-9`} />
                    </div>
                  </div>
                  <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 sm:mb-2.5 truncate">Upgrade</label>
                    <div className="relative w-full flex items-center">
                      <span className="absolute left-4 top-3.5 sm:top-4 text-[13px] sm:text-[14px] font-medium text-white/60 shrink-0">₹</span>
                      <input type="number" placeholder="0" value={saleForm.upgrade} onChange={(e) => setSaleForm({...saleForm, upgrade: e.target.value})} className={`${glassInput} pl-8 sm:pl-9`} />
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* TAB 2: MODELS */}
        {activeBottomTab === 'models' && (
          <div className="flex flex-col h-full z-10 w-full overflow-hidden">
            <header className="bg-transparent px-4 sm:px-5 pt-8 sm:pt-10 pb-3 sm:pb-4 sticky top-0 z-20 shrink-0 w-full">
              <div className="flex items-center justify-between mb-5 sm:mb-6 w-full">
                <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white truncate drop-shadow-md">Devices</h1>
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <button onClick={exportModelsToCSV} className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-white/10 border border-white/20 text-white/80 rounded-full hover:bg-white/20 hover:text-white transition-all backdrop-blur-md shadow-sm shrink-0"><FileDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2}/></button>
                  <button onClick={fetchModelsFromSheet} disabled={loadingModels} className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-white text-black rounded-full hover:bg-white/90 transition-all disabled:opacity-50 shrink-0 shadow-lg">
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${loadingModels ? 'animate-spin' : ''}`} strokeWidth={2.5}/>
                    <span className="text-[11px] sm:text-[13px] font-bold">Sync</span>
                  </button>
                </div>
              </div>
              <div className="relative mb-5 sm:mb-6 w-full flex items-center">
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 absolute left-4 sm:left-4.5 text-white/50 shrink-0" strokeWidth={2}/>
                <input type="text" placeholder="Search models..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${glassInput} pl-11 sm:pl-12`} />
              </div>
              
              <div className="flex overflow-x-auto hide-scrollbar pb-3 sm:pb-4 space-x-2 sm:space-x-3 scroll-smooth w-full">
                <button 
                  id="tab-ALL" 
                  onClick={() => { setActiveSeries('ALL'); setSearchQuery(''); document.getElementById('tab-ALL')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }} 
                  className={`shrink-0 px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-bold transition-all border whitespace-nowrap shadow-sm ${activeSeries === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20 backdrop-blur-md'}`}
                >
                  All Devices
                </button>
                {SHEET_TABS.map((tab) => (
                  <button 
                    key={tab.gid} 
                    id={`tab-${tab.gid}`} 
                    onClick={() => { setActiveSeries(tab.gid); setSearchQuery(''); document.getElementById(`tab-${tab.gid}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }} 
                    className={`shrink-0 px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-bold transition-all border whitespace-nowrap shadow-sm ${activeSeries === tab.gid ? 'bg-white text-black border-white' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20 backdrop-blur-md'}`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-32 px-4 sm:px-5 pt-2 sm:pt-3 hide-scrollbar w-full">
              {loadingModels ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/70 w-full"><Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mb-3 sm:mb-4 opacity-80 shrink-0" strokeWidth={2}/><p className="font-medium text-[12px] sm:text-[14px]">Fetching Data...</p></div>
              ) : modelsError ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/70 w-full"><AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-80 shrink-0" strokeWidth={2}/><p className="text-[12px] sm:text-[14px] font-medium text-center px-4">{modelsError}</p></div>
              ) : filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/40 w-full"><Search className="w-10 h-10 sm:w-12 h-12 mb-3 sm:mb-4 opacity-50 shrink-0" strokeWidth={1.5}/> <p className="text-[12px] sm:text-[14px] font-medium">No models found</p></div>
              ) : (
                <div className="w-full flex flex-col gap-3 sm:gap-3.5">
                  {filteredModels.map((model) => {
                    const incentive = calculateIncentive(model);
                    const isWearable = model.seriesGid === '596867009' || /WATCH|BUDS|RING/i.test(model.modelName) || /WATCH|BUDS|RING/i.test(model.modelCode);
                    
                    return (
                      <div key={model.id} className={`${glassCard} p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-white/15 transition-colors w-full`}>
                        <div className="flex items-center space-x-3.5 sm:space-x-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 border border-white/20 text-white/80 shrink-0 shadow-inner`}>
                            {isWearable ? <Watch className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" strokeWidth={2}/> : <Smartphone className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" strokeWidth={2}/>}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0 pr-2">
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest truncate w-full mb-0.5 sm:mb-1">{model.modelCode || 'N/A'}</span>
                            <span className="text-[13px] sm:text-[14px] font-bold text-white truncate w-full drop-shadow-sm">{model.modelName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 pl-3 sm:pl-4 border-l border-white/20 justify-center h-full">
                          <div className="flex items-baseline space-x-1.5 sm:space-x-2 shrink-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase shrink-0">DP</span>
                            <span className="text-[13px] sm:text-[15px] font-bold text-white shrink-0 drop-shadow-sm">{model.dp ? (model.dp.toString().includes('₹') ? model.dp : `₹${model.dp}`) : 'N/A'}</span>
                          </div>
                          {incentive > 0 ? (
                            <div className="mt-1.5 sm:mt-2 text-white flex items-center whitespace-nowrap bg-white/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-white/30 shrink-0 shadow-inner">
                              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/80 shrink-0">Inc:</span><span className="text-[10.5px] sm:text-[12px] font-bold ml-1 sm:ml-1.5 shrink-0">+₹{incentive}</span>
                            </div>
                          ) : <div className="mt-1.5 sm:mt-2 h-[18px] sm:h-[22px]"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeBottomTab === 'settings' && (
          <div className="flex flex-col h-full z-10 w-full overflow-hidden">
            {activeSettingsPage === 'main' ? (
              <div className="px-4 sm:px-5 pt-8 sm:pt-10 hide-scrollbar overflow-y-auto pb-32 w-full flex flex-col gap-4 sm:gap-5">
                <div className="flex items-center justify-between w-full shrink-0 mb-2">
                  <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white truncate drop-shadow-md">Settings</h1>
                  <span className="flex items-center text-[9px] sm:text-[10px] font-bold text-white bg-white/20 border border-white/30 px-3 sm:px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-sm backdrop-blur-md shrink-0"><HardDrive className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 opacity-80 shrink-0" strokeWidth={2} /> Local</span>
                </div>

                {saveMessage && (
                  <div className="bg-white/20 border border-white/40 text-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-5 text-[12px] sm:text-[14px] font-bold text-center flex items-center justify-center shadow-lg backdrop-blur-md w-full shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2.5 shrink-0" strokeWidth={2.5}/> <span className="truncate">{saveMessage}</span>
                  </div>
                )}

                <div className={`${glassCard} overflow-hidden w-full shrink-0`}>
                  <button onClick={() => { setDraftSlabs(JSON.parse(JSON.stringify(incentiveSlabs))); setActiveSettingsPage('incentives'); setExpandedSection('smartphone'); }} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#1A5F7A] flex items-center justify-center shrink-0 shadow-lg"><span className="text-[16px] sm:text-[18px] font-extrabold shrink-0">₹</span></div>
                      <p className="text-[14px] sm:text-[15px] font-bold text-white truncate drop-shadow-sm">Payout Configuration</p>
                    </div>
                    <div className="p-2.5 rounded-full bg-black/20 border border-white/20 shrink-0"><ChevronRight className="w-4 h-4 text-white/80 shrink-0" strokeWidth={2} /></div>
                  </button>
                </div>

                <div className={`${glassCard} p-5 sm:p-6 w-full shrink-0`}>
                  <h2 className="text-[11px] sm:text-[13px] font-bold text-white uppercase tracking-widest flex items-center mb-3 sm:mb-4 truncate drop-shadow-sm"><Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2.5 opacity-90 shrink-0" strokeWidth={2}/> Data Backup</h2>
                  <p className="text-[12px] sm:text-[13.5px] text-white/80 mb-5 sm:mb-6 leading-relaxed font-medium">Securely save your sales and settings data locally, or restore a previous backup.</p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                    <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-white/10 border border-white/30 text-white hover:bg-white/20 rounded-[16px] sm:rounded-[20px] text-[12.5px] sm:text-[13.5px] font-bold transition-colors shadow-inner shrink-0"><Download className="w-4.5 h-4.5 opacity-80 shrink-0" strokeWidth={2}/> Backup</button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={isRestoring} className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-white/10 border border-white/30 text-white hover:bg-white/20 rounded-[16px] sm:rounded-[20px] text-[12.5px] sm:text-[13.5px] font-bold transition-colors shadow-inner disabled:opacity-50 shrink-0">
                      {isRestoring ? <Loader2 className="w-4.5 h-4.5 animate-spin opacity-80 shrink-0" strokeWidth={2} /> : <Upload className="w-4.5 h-4.5 opacity-80 shrink-0" strokeWidth={2} />} {isRestoring ? 'Restoring...' : 'Restore'}
                    </button>
                    <input type="file" accept=".json,application/json,text/plain" ref={fileInputRef} onChange={handleRestore} className="hidden" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full w-full overflow-hidden">
                <div className="flex items-center justify-between px-3 sm:px-4 pt-8 sm:pt-10 pb-4 sm:pb-5 sticky top-0 bg-[#1A5F7A]/80 backdrop-blur-2xl z-20 w-full shrink-0 border-b border-white/10">
                  <button onClick={() => setActiveSettingsPage('main')} className="flex items-center space-x-1.5 sm:space-x-2 text-white/80 hover:text-white p-2 sm:p-2.5 bg-white/10 border border-white/20 hover:bg-white/20 rounded-full transition-colors shrink-0 ml-1"><ArrowLeft className="w-5 h-5 shrink-0" strokeWidth={2}/></button>
                  <button onClick={saveSettingsLocal} className="text-[#1A5F7A] bg-white font-bold text-[12px] sm:text-[13.5px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-white/90 flex items-center mr-1 transition-all shrink-0 shadow-lg"><Save className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" strokeWidth={2}/> Save</button>
                </div>
                
                <main className="flex-1 overflow-y-auto pb-32 pt-4 sm:pt-5 px-4 sm:px-5 hide-scrollbar w-full flex flex-col gap-4 sm:gap-5">
                  {saveMessage && <div className="w-full p-4 bg-white/20 border border-white/40 text-white rounded-[16px] sm:rounded-[20px] text-[12px] sm:text-[13.5px] font-bold text-center flex justify-center items-center shadow-inner backdrop-blur-md shrink-0"><Check className="w-5 h-5 mr-2.5 shrink-0" strokeWidth={2.5}/> <span className="truncate">{saveMessage}</span></div>}

                  {/* Smartphones Section */}
                  <div className={`${glassCard} w-full shrink-0 overflow-hidden transition-all duration-300`}>
                    <button onClick={() => setExpandedSection(expandedSection === 'smartphone' ? null : 'smartphone')} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0"><div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner"><Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} /></div><span className="text-[14px] sm:text-[15px] font-bold text-white truncate drop-shadow-sm">Smartphones</span></div>
                      <div className={`transition-transform duration-300 p-1.5 sm:p-2 bg-black/20 rounded-full border border-white/10 shrink-0 ${expandedSection === 'smartphone' ? 'rotate-90' : ''}`}><ChevronRight className={`w-4 h-4 text-white`} strokeWidth={2} /></div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col w-full ${expandedSection === 'smartphone' ? 'max-h-[2000px] opacity-100 border-t border-white/20 bg-black/10' : 'max-h-0 opacity-0'}`}>
                      <div className="p-4 sm:p-5 border-b border-white/10 w-full flex flex-col gap-2.5">
                        <h2 className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest flex items-center truncate drop-shadow-sm"><AlertTriangle className="w-4 h-4 mr-2 opacity-90 shrink-0" strokeWidth={2}/> M & F Series Rule</h2>
                        <p className="text-[11px] sm:text-[12.5px] text-white/80 leading-relaxed font-medium">Entered models receive <strong className="text-white font-bold drop-shadow-md">100%</strong> incentive, others <strong className="text-white font-bold drop-shadow-md">50%</strong>.</p>
                        <input type="text" value={draftSlabs?.mfExceptions || ''} onChange={(e) => setDraftSlabs({...draftSlabs, mfExceptions: e.target.value})} placeholder="e.g. F17, F56" className={`${glassInput} w-full mt-1`} />
                      </div>

                      <div className="p-4 sm:p-5 border-b border-white/10 w-full flex flex-col gap-3.5">
                        <h2 className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest truncate drop-shadow-sm">Focus Models (Fixed Inc.)</h2>
                        <div className={`${glassCardInner} overflow-hidden w-full flex flex-col`}>
                          {draftSlabs?.smartphoneExceptions?.map((exc, index) => (
                            <div key={exc.id} className="flex flex-col p-3.5 border-b border-white/10 last:border-0 gap-3 w-full">
                              <input type="text" value={exc.models} onChange={(e) => handleArrayChange('smartphoneExceptions', index, 'models', e.target.value)} placeholder="Model Names (e.g. S24 Ultra)" className={`${glassInput} w-full py-2.5`} />
                              <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center flex-1 min-w-0 bg-black/20 border border-white/20 px-3.5 py-2.5 rounded-[12px] sm:rounded-[16px] shadow-inner">
                                  <span className="text-[12px] sm:text-[13px] font-bold text-white/70 mr-2 shrink-0">₹</span>
                                  <input type="number" value={exc.amount} onChange={(e) => handleArrayChange('smartphoneExceptions', index, 'amount', e.target.value)} className="w-full min-w-0 text-[13px] sm:text-[15px] font-bold text-white bg-transparent focus:outline-none" />
                                </div>
                                <button onClick={() => removeExceptionRow('smartphoneExceptions', index)} className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 shrink-0 text-[10px] sm:text-[11px] font-bold text-white/90 bg-red-500/30 hover:bg-red-500/50 border border-red-500/40 rounded-[12px] sm:rounded-[16px] transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2}/> <span className="hidden sm:inline">Remove</span></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addExceptionRow('smartphoneExceptions')} className="w-full shrink-0 flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 font-bold text-[11px] sm:text-[12.5px] transition-colors"><Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" strokeWidth={2} /> Add Focus Model</button>
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2"><p className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest truncate drop-shadow-sm">DP Based Slabs</p></div>
                      <div className="pb-4 sm:pb-5 px-4 sm:px-5 w-full flex flex-col">
                        {draftSlabs?.smartphone.map((slab, index) => (
                          <div key={slab.id} className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0 w-full gap-2">
                            <span className="text-[12.5px] sm:text-[14px] font-bold text-white truncate min-w-0 flex-1 pr-2 drop-shadow-sm">{slab.label}</span>
                            <div className="flex items-center bg-black/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] border border-white/20 shadow-inner shrink-0 w-[90px] sm:w-[110px]">
                              <span className="text-[11.5px] sm:text-[12.5px] font-bold text-white/70 mr-1.5 shrink-0">₹</span>
                              <input type="number" value={slab.amount} onChange={(e) => handleArrayChange('smartphone', index, 'amount', e.target.value)} className="w-full min-w-0 text-right text-[13px] sm:text-[14.5px] font-bold text-white bg-transparent focus:outline-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tablets Section */}
                  <div className={`${glassCard} w-full shrink-0 overflow-hidden transition-all duration-300`}>
                    <button onClick={() => setExpandedSection(expandedSection === 'tablet' ? null : 'tablet')} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0"><div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner"><LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} /></div><span className="text-[14px] sm:text-[15px] font-bold text-white truncate drop-shadow-sm">Tablets</span></div>
                      <div className={`transition-transform duration-300 p-1.5 sm:p-2 bg-black/20 rounded-full border border-white/10 shrink-0 ${expandedSection === 'tablet' ? 'rotate-90' : ''}`}><ChevronRight className={`w-4 h-4 text-white`} strokeWidth={2} /></div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col w-full ${expandedSection === 'tablet' ? 'max-h-[2000px] opacity-100 border-t border-white/20 bg-black/10' : 'max-h-0 opacity-0'}`}>
                      <div className="p-4 sm:p-5 border-b border-white/10 w-full flex flex-col gap-3.5">
                        <h2 className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest truncate drop-shadow-sm">Focus Models (Fixed Inc.)</h2>
                        <div className={`${glassCardInner} overflow-hidden w-full flex flex-col`}>
                          {draftSlabs?.tabExceptions?.map((exc, index) => (
                            <div key={exc.id} className="flex flex-col p-3.5 border-b border-white/10 last:border-0 gap-3 w-full">
                              <input type="text" value={exc.models} onChange={(e) => handleArrayChange('tabExceptions', index, 'models', e.target.value)} placeholder="Enter Tab Models (e.g. S11 Ultra)" className={`${glassInput} w-full py-2.5`} />
                              <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center flex-1 min-w-0 bg-black/20 border border-white/20 px-3.5 py-2.5 rounded-[12px] sm:rounded-[16px] shadow-inner">
                                  <span className="text-[12px] sm:text-[13px] font-bold text-white/70 mr-2 shrink-0">₹</span>
                                  <input type="number" value={exc.amount} onChange={(e) => handleArrayChange('tabExceptions', index, 'amount', e.target.value)} className="w-full min-w-0 text-[13px] sm:text-[15px] font-bold text-white bg-transparent focus:outline-none" />
                                </div>
                                <button onClick={() => removeExceptionRow('tabExceptions', index)} className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 shrink-0 text-[10px] sm:text-[11px] font-bold text-white/90 bg-red-500/30 hover:bg-red-500/50 border border-red-500/40 rounded-[12px] sm:rounded-[16px] transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2}/> <span className="hidden sm:inline">Remove</span></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addExceptionRow('tabExceptions')} className="w-full shrink-0 flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 font-bold text-[11px] sm:text-[12.5px] transition-colors"><Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" strokeWidth={2} /> Add Focus Model</button>
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 w-full"><p className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest truncate drop-shadow-sm">DP Based Slabs</p></div>
                      <div className="pb-4 sm:pb-5 px-4 sm:px-5 w-full flex flex-col">
                        {draftSlabs?.tab.map((slab, index) => (
                          <div key={slab.id} className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0 w-full gap-2">
                            <span className="text-[12.5px] sm:text-[14px] font-bold text-white truncate min-w-0 flex-1 pr-2 drop-shadow-sm">{slab.label}</span>
                            <div className="flex items-center bg-black/20 px-4 py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] border border-white/20 shadow-inner shrink-0 w-[90px] sm:w-[110px]">
                              <span className="text-[11.5px] sm:text-[12.5px] font-bold text-white/70 mr-1.5 shrink-0">₹</span>
                              <input type="number" value={slab.amount} onChange={(e) => handleArrayChange('tab', index, 'amount', e.target.value)} className="w-full min-w-0 text-right text-[13px] sm:text-[14.5px] font-bold text-white bg-transparent focus:outline-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Wearables Section */}
                  <div className={`${glassCard} w-full shrink-0 mb-6 overflow-hidden transition-all duration-300`}>
                    <button onClick={() => setExpandedSection(expandedSection === 'wearable' ? null : 'wearable')} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0"><div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner"><Watch className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} /></div><span className="text-[14px] sm:text-[15px] font-bold text-white truncate drop-shadow-sm">Wearables</span></div>
                      <div className={`transition-transform duration-300 p-1.5 sm:p-2 bg-black/20 rounded-full border border-white/10 shrink-0 ${expandedSection === 'wearable' ? 'rotate-90' : ''}`}><ChevronRight className={`w-4 h-4 text-white`} strokeWidth={2} /></div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col w-full ${expandedSection === 'wearable' ? 'max-h-[5000px] opacity-100 border-t border-white/20 bg-black/10' : 'max-h-0 opacity-0'}`}>
                      <div className="p-4 sm:p-5 w-full flex flex-col gap-3.5">
                        <h2 className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest truncate drop-shadow-sm">Base Incentive Settings</h2>
                        <div className={`${glassCardInner} overflow-hidden w-full flex flex-col`}>
                          {draftSlabs?.wearableExceptions?.map((exc, index) => (
                            <div key={exc.id} className="flex flex-col p-3.5 border-b border-white/10 last:border-0 gap-3 w-full">
                              <input type="text" value={exc.models} onChange={(e) => handleArrayChange('wearableExceptions', index, 'models', e.target.value)} placeholder="Model Names (e.g. Watch Ultra)" className={`${glassInput} w-full py-2.5`} />
                              <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center flex-1 min-w-0 bg-black/20 border border-white/20 px-3.5 py-2.5 rounded-[12px] sm:rounded-[16px] shadow-inner">
                                  <span className="text-[12px] sm:text-[13px] font-bold text-white/70 mr-2 shrink-0">₹</span>
                                  <input type="number" value={exc.amount} onChange={(e) => handleArrayChange('wearableExceptions', index, 'amount', e.target.value)} className="w-full min-w-0 text-[13px] sm:text-[15px] font-bold text-white bg-transparent focus:outline-none" />
                                </div>
                                <button onClick={() => removeExceptionRow('wearableExceptions', index)} className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 shrink-0 text-[10px] sm:text-[11px] font-bold text-white/90 bg-red-500/30 hover:bg-red-500/50 border border-red-500/40 rounded-[12px] sm:rounded-[16px] transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2}/> <span className="hidden sm:inline">Remove</span></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addExceptionRow('wearableExceptions')} className="w-full shrink-0 flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 font-bold text-[11px] sm:text-[12.5px] transition-colors"><Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" strokeWidth={2} /> Add Wearable Rule</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV (LIQUID GLASS DOCK) */}
      {!isAddingSale && !showTargetModal && !saleToDelete && !backupDataToRestore && (!activeSettingsPage || activeSettingsPage === 'main') && (
        <div className="fixed bottom-5 sm:bottom-7 left-0 right-0 z-40 flex justify-center items-center pointer-events-none px-4 sm:px-6 w-full">
          <nav className="bg-white/10 backdrop-blur-[40px] border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-full w-full max-w-[280px] sm:max-w-[340px] py-2.5 sm:py-3.5 flex items-center justify-around pointer-events-auto">
            <button onClick={() => { setActiveBottomTab('dashboard'); setIsAddingSale(false); }} className={`relative p-2.5 sm:p-3 rounded-full transition-all duration-300 shrink-0 ${activeBottomTab === 'dashboard' ? 'bg-white text-[#1A5F7A] shadow-[0_4px_12px_rgba(255,255,255,0.4)] scale-105 sm:scale-110' : 'hover:bg-white/10'}`}>
              <LayoutDashboard className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-300 shrink-0 ${activeBottomTab === 'dashboard' ? 'text-[#1A5F7A]' : 'text-white/70'}`} strokeWidth={2} />
            </button>
            <button onClick={() => setActiveBottomTab('models')} className={`relative p-2.5 sm:p-3 rounded-full transition-all duration-300 shrink-0 ${activeBottomTab === 'models' ? 'bg-white text-[#1A5F7A] shadow-[0_4px_12px_rgba(255,255,255,0.4)] scale-105 sm:scale-110' : 'hover:bg-white/10'}`}>
              <Users className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-300 shrink-0 ${activeBottomTab === 'models' ? 'text-[#1A5F7A]' : 'text-white/70'}`} strokeWidth={2} />
            </button>
            <button onClick={() => { setActiveBottomTab('settings'); setActiveSettingsPage('main'); }} className={`relative p-2.5 sm:p-3 rounded-full transition-all duration-300 shrink-0 ${activeBottomTab === 'settings' ? 'bg-white text-[#1A5F7A] shadow-[0_4px_12px_rgba(255,255,255,0.4)] scale-105 sm:scale-110' : 'hover:bg-white/10'}`}>
              <Settings className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-300 shrink-0 ${activeBottomTab === 'settings' ? 'text-[#1A5F7A]' : 'text-white/70'}`} strokeWidth={2} />
            </button>
          </nav>
        </div>
      )}

      {/* STRICT CSS OVERRIDES TO PREVENT BODY OVERFLOW & BOUNCE */}
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
          position: relative;
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        input, select, textarea {
          -webkit-user-select: auto !important;
          user-select: auto !important;
        }
        .can-select {
          -webkit-user-select: text !important;
          user-select: text !important;
          -webkit-touch-callout: default !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } 
        ::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.8; cursor: pointer; }
      `}} />
    </div>
  );
}
