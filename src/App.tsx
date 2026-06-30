import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  FolderLock,
  Cpu,
  Server,
  CloudCheck,
  ChevronDown,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

import { BucketItem, StorageClass, RedundancyStrategy, AclType, AccessKey, ResourcePackage } from './types';
import { REGIONS, INITIAL_BUCKETS, INITIAL_RESOURCE_PACKAGES, BUCKET_MONITOR_PRESETS, INITIAL_OBJECTS } from './data';

// Import subcomponents
import ConsoleHeader from './components/ConsoleHeader';
import ConsoleSidebar from './components/ConsoleSidebar';
import Overview from './components/Overview';
import BucketDetails from './components/BucketDetails';

export default function App() {
  // Navigation Module: 'dashboard' (概览) | 'object-storage' (对象存储 ZOS)
  const [currentModule, setCurrentModule] = useState<string>('object-storage');

  // Persistence States
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [resourcePackages, setResourcePackages] = useState<ResourcePackage[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);

  // Detailed bucket selected
  const [selectedBucket, setSelectedBucket] = useState<BucketItem | null>(null);

  // Filters & Searches inside buckets listing
  const [searchBucketQuery, setSearchBucketQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');

  // Buckets creator modal
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketRegion, setNewBucketRegion] = useState('长沙-公共资源池');
  const [newBucketClass, setNewBucketClass] = useState<StorageClass>('STANDARD');
  const [newBucketRedundancy, setNewBucketRedundancy] = useState<RedundancyStrategy>('MULTI_AZ');
  const [newBucketAcl, setNewBucketAcl] = useState<AclType>('private');
  const [newBucketProject, setNewBucketProject] = useState('default');

  // Initial load
  useEffect(() => {
    // 1. Buckets
    const cachedBuckets = localStorage.getItem('zos_buckets');
    if (cachedBuckets) {
      setBuckets(JSON.parse(cachedBuckets));
    } else {
      setBuckets(INITIAL_BUCKETS);
      localStorage.setItem('zos_buckets', JSON.stringify(INITIAL_BUCKETS));
    }

    // 2. Resource packages
    const cachedPackages = localStorage.getItem('zos_resource_packages');
    if (cachedPackages) {
      setResourcePackages(JSON.parse(cachedPackages));
    } else {
      setResourcePackages(INITIAL_RESOURCE_PACKAGES);
      localStorage.setItem('zos_resource_packages', JSON.stringify(INITIAL_RESOURCE_PACKAGES));
    }

    // 3. Access Keys
    const cachedKeys = localStorage.getItem('zos_access_keys');
    if (cachedKeys) {
      setAccessKeys(JSON.parse(cachedKeys));
    } else {
      const defaultKeys: AccessKey[] = [
        {
          accessKeyId: 'AKSK9YUBDXNVDXA8L',
          secretAccessKey: 'ZOSSECRETKEY29E84228B99B43AD39B5',
          status: 'active',
          createTime: '2026-01-05 09:15:04',
        },
      ];
      setAccessKeys(defaultKeys);
      localStorage.setItem('zos_access_keys', JSON.stringify(defaultKeys));
    }
  }, []);

  // Sync helpers
  const saveBuckets = (newList: BucketItem[]) => {
    setBuckets(newList);
    localStorage.setItem('zos_buckets', JSON.stringify(newList));
  };

  const savePackages = (newPkgs: ResourcePackage[]) => {
    setResourcePackages(newPkgs);
    localStorage.setItem('zos_resource_packages', JSON.stringify(newPkgs));
  };

  const saveKeys = (newKeys: AccessKey[]) => {
    setAccessKeys(newKeys);
    localStorage.setItem('zos_access_keys', JSON.stringify(newKeys));
  };

  // Create bucket handle
  const handleCreateBucket = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBucketName) {
      alert('请填写存储桶 (Bucket) 唯一的识别代码名称！');
      return;
    }

    // Standard S3 validators
    const nameRegex = /^[a-z0-9.-]{3,63}$/;
    if (!nameRegex.test(newBucketName)) {
      alert('⚠️ 校验失败: 存储桶名称不合规。\n名称规则: 长度为 3-63 字符，只允许小写字母、数字、中划线(-)和英文句号(.)，不能以中划线开头或结尾。');
      return;
    }

    // Global unique check
    const isDuplicate = buckets.some((b) => b.name === newBucketName);
    if (isDuplicate) {
      alert('⚠️ 该存储桶名称已被占用！请使用其他不重复的名称进行创建（Bucket 名全局唯一）。');
      return;
    }

    const newBucket: BucketItem = {
      name: newBucketName,
      region: newBucketRegion,
      storageClass: newBucketClass,
      redundancy: newBucketRedundancy,
      acl: newBucketAcl,
      enterpriseProject: newBucketProject,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      encryption: {
        enabled: false,
        type: 'SSE-KMS',
      },
      referer: {
        enabled: false,
        allowEmpty: true,
        whitelist: [],
        blacklist: [],
      },
      worm: {
        enabled: false,
        retentionDays: 30,
        locked: false,
      },
      lifecycleRules: [],
      replication: {
        enabled: false,
        rules: [],
      },
      eventNotifications: [],
      inventories: [],
    };

    const nextList = [...buckets, newBucket];
    saveBuckets(nextList);

    // Initial empty objects state cache for this bucket
    localStorage.setItem(`zos_objects_${newBucketName}`, JSON.stringify([]));

    // Reset Form
    setNewBucketName('');
    setShowCreateBucket(false);
  };

  // Delete bucket handle (Page 113)
  const handleDeleteBucket = (bucketName: string, wormLocked: boolean) => {
    if (wormLocked) {
      alert('⚠️ 无法删除: 该存储桶启用了 WORM 安全锁定，尚在合规保留期限内，禁止物理清除。');
      return;
    }

    // S3 Rule: bucket must be empty first (Page 48)
    const objectsCached = localStorage.getItem(`zos_objects_${bucketName}`);
    const objectsArr = objectsCached ? JSON.parse(objectsCached) : [];
    if (objectsArr.length > 0) {
      alert('⚠️ 无法删除存储桶: 存储桶内仍存有数据对象或历史版本。请先彻底清除桶内所有文件和分段碎片后再重试。');
      return;
    }

    if (confirm(`警告！确认物理擦除删除 ZOS 存储桶 "${bucketName}" 吗？此操作不可逆。`)) {
      const nextList = buckets.filter((b) => b.name !== bucketName);
      saveBuckets(nextList);
      localStorage.removeItem(`zos_objects_${bucketName}`);
    }
  };

  // Filtering Logic
  const filteredBuckets = buckets.filter((b) => {
    const matchesQuery = b.name.toLowerCase().includes(searchBucketQuery.toLowerCase());
    const matchesRegion = filterRegion === 'ALL' || b.region === filterRegion;
    const matchesClass = filterClass === 'ALL' || b.storageClass === filterClass;
    return matchesQuery && matchesRegion && matchesClass;
  });

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col font-sans" id="idealcloud-platform-root">
      {/* Platform Header */}
      <ConsoleHeader userName="李媛媛" notificationCount={2} />

      {/* Main shell Layout: Sidebar + Main Content workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side menu drawer */}
        <ConsoleSidebar currentModule={currentModule} setCurrentModule={setCurrentModule} />

        {/* Right side primary viewport */}
        <main className="flex-1 bg-[#f4f6f8] overflow-y-auto px-6 py-5 scrollbar-thin">
          
          {/* Active Detail Sub-Explorer override */}
          {selectedBucket ? (
            <BucketDetails
              bucket={selectedBucket}
              bucketsList={buckets}
              originObjects={INITIAL_OBJECTS}
              onBack={() => {
                // Update selectedBucket with latest state from list in case edited
                setSelectedBucket(null);
              }}
              onUpdateBucket={(updated) => {
                const nextBuckets = buckets.map((b) => (b.name === updated.name ? updated : b));
                saveBuckets(nextBuckets);
                setSelectedBucket(updated);
              }}
            />
          ) : (
            <>
              {/* Route module 1: Consoles overview (概览) */}
              {currentModule === 'dashboard' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">平台系统集成概览 (idealcloud overview)</h2>
                    <p className="text-[11px] text-slate-500 mt-1">智算云资源及 ZOS 端点连接情况汇总监控...</p>
                  </div>
                  <Overview
                    buckets={buckets}
                    resourcePackages={resourcePackages}
                    setResourcePackages={savePackages}
                    accessKeys={accessKeys}
                    setAccessKeys={saveKeys}
                  />
                </div>
              )}

              {/* Route module 2: Object Storage ZOS bucket explorer (对象存储) */}
              {currentModule === 'object-storage' && (
                <div className="space-y-5" id="zos-bucket-explorer">
                  
                  {/* Breadcrumb line from the image */}
                  <div className="flex items-center space-x-2 text-slate-500 text-xs font-normal mb-4">
                    <span>基础资源</span>
                    <span>/</span>
                    <span>对象存储 ZOS</span>
                    <span>/</span>
                    <span className="text-slate-850 font-semibold font-mono">存储桶列表</span>
                  </div>

                  {/* Filter / Search Bar styled exactly like the screenshot */}
                  <div className="bg-white p-4 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
                    {/* Leftside orange action button */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowCreateBucket(true)}
                        className="bg-[#fa541c] hover:bg-[#e03d00] text-white font-bold text-xs px-5 py-1.5 rounded flex items-center space-x-1.5 shadow-sm shadow-[#fa541c]/10 cursor-pointer transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>新建存储桶</span>
                      </button>
                    </div>

                    {/* Middle Filters & Search Inputs */}
                    <div className="flex flex-wrap items-center gap-4 flex-1 justify-end">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="请输入存储桶名称..."
                          value={searchBucketQuery}
                          onChange={(e) => setSearchBucketQuery(e.target.value)}
                          className="w-48 bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa541c] text-xs"
                        />
                      </div>

                      <div>
                        <select
                          value={filterRegion}
                          onChange={(e) => setFilterRegion(e.target.value)}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded px-3 py-1.5 text-slate-705 select-none focus:outline-none text-xs"
                        >
                          <option value="ALL">选择所属区域</option>
                          {REGIONS.map((r) => (
                            <option key={r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded px-3 py-1.5 text-slate-705 select-none focus:outline-none font-mono text-xs"
                        >
                          <option value="ALL">选择设置类型</option>
                          <option value="STANDARD">标准存储型 STANDARD</option>
                          <option value="IA">低频访问型 IA</option>
                          <option value="ARCHIVE">极便归档型 ARCHIVE</option>
                        </select>
                      </div>

                      {/* Image Query and Reset Style buttons */}
                      <button
                        onClick={() => {
                          const cached = localStorage.getItem('zos_buckets');
                          if (cached) setBuckets(JSON.parse(cached));
                        }}
                        className="bg-white border border-[#fa541c] text-[#fa541c] hover:bg-[#fa541c]/5 font-bold px-5 py-1.5 rounded transition-all transition-colors text-xs cursor-pointer select-none"
                      >
                        查询
                      </button>

                      <button
                        onClick={() => {
                          setSearchBucketQuery('');
                          setFilterRegion('ALL');
                          setFilterClass('ALL');
                        }}
                        className="bg-white border border-slate-300 text-slate-750 hover:bg-slate-50 font-medium px-5 py-1.5 rounded transition-all transition-colors text-xs cursor-pointer select-none"
                      >
                        重置
                      </button>
                    </div>
                  </div>

                  {/* Buckets Grid lists representation */}
                  <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs text-slate-700 font-sans">
                      <thead>
                        <tr className="bg-[#f5f7fa] text-slate-800 border-b border-slate-200 text-xs font-bold select-none">
                          <th className="py-3 px-4">名称</th>
                          <th className="py-3 px-3">状态</th>
                          <th className="py-3 px-3">所属区域</th>
                          <th className="py-3 px-3">首置存储类型</th>
                          <th className="py-3 px-3">冗余备份</th>
                          <th className="py-3 px-3">安全访问(ACL)</th>
                          <th className="py-3 px-3">所属企业规划</th>
                          <th className="py-3 px-3">加密防护</th>
                          <th className="py-3 px-3">WORM合规锁</th>
                          <th className="py-3 px-3 text-right">物理建立时间</th>
                          <th className="py-3 px-3 text-center w-32">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredBuckets.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-12 text-center text-slate-500 text-[11px] bg-white">
                              未匹配到任何 理想对象存储存储桶 (ZOS Buckets)。请先点击左侧 “新建存储桶”
                              建立新的云端存储环境。
                            </td>
                          </tr>
                        ) : (
                          filteredBuckets.map((b) => (
                            <tr key={b.name} className="hover:bg-slate-50/55 transition-colors bg-white text-slate-700">
                              {/* Name */}
                              <td className="py-4 px-4 font-bold text-slate-900 tracking-wide">
                                <button
                                  onClick={() => setSelectedBucket(b)}
                                  className="text-left font-bold text-[#fa541c] hover:underline focus:outline-none flex items-center space-x-1.5 cursor-pointer font-sans"
                                >
                                  <Database className="h-4 w-4 text-[#fa541c]/90 text-orange-500" />
                                  <span>{b.name}</span>
                                </button>
                              </td>

                              {/* Status */}
                              <td className="py-4 px-3 font-sans">
                                <span className="flex items-center space-x-1.5 font-bold text-slate-800">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#52c41a]"></span>
                                  <span>可用</span>
                                </span>
                              </td>

                              {/* Region */}
                              <td className="py-4 px-3 text-slate-600 font-medium">{b.region}</td>

                              {/* Storage class */}
                              <td className="py-4 px-3 font-mono text-slate-605 uppercase">
                                {b.storageClass}
                              </td>

                              {/* Redundancy */}
                              <td className="py-4 px-3 font-medium text-slate-500">
                                {b.redundancy === 'MULTI_AZ' ? '多 AZ 冗余' : '单 AZ 存储'}
                              </td>

                              {/* ACL */}
                              <td className="py-4 px-3 select-none">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    b.acl === 'private'
                                      ? 'bg-slate-100 text-slate-500'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {b.acl === 'private' ? '私有' : b.acl === 'public-read' ? '公共读' : '公共读写'}
                                </span>
                              </td>

                              {/* Enterprise Project */}
                              <td className="py-4 px-3 font-mono text-slate-500">{b.enterpriseProject}</td>

                              {/* Encryption status */}
                              <td className="py-4 px-3 select-none font-sans">
                                {b.encryption.enabled ? (
                                  <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block"></span>
                                    <span>启用</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">未设置</span>
                                )}
                              </td>

                              {/* WORM */}
                              <td className="py-4 px-3 select-none">
                                {b.worm.locked ? (
                                  <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                    锁定中
                                  </span>
                                ) : (
                                  <span className="text-slate-400">未启用</span>
                                )}
                              </td>

                              {/* Create Time */}
                              <td className="py-4 px-3 text-right font-mono text-slate-500">
                                {b.createTime}
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-3 text-center space-x-2.5 select-none font-semibold">
                                <button
                                  onClick={() => setSelectedBucket(b)}
                                  className="text-xs text-[#fa541c] hover:underline cursor-pointer font-bold"
                                >
                                  管理
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => handleDeleteBucket(b.name, b.worm.locked)}
                                  className="text-xs text-red-600 hover:text-red-500 hover:underline cursor-pointer"
                                >
                                  物理删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Pagination matching screenshot exactly */}
                    <div className="bg-white px-5 py-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-xs select-none">
                      <div>
                        共 <span className="font-semibold text-slate-700">{filteredBuckets.length}</span> 条
                      </div>
                      <div className="flex items-center space-x-2">
                        <select defaultValue="10条/页" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#fa541c]">
                          <option value="5条/页">5条/页</option>
                          <option value="10条/页">10条/页</option>
                          <option value="20条/页">20条/页</option>
                        </select>
                        <button className="h-6 px-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-400 rounded text-xs select-none flex items-center justify-center">
                          &lt;
                        </button>
                        <button className="h-6 w-6 rounded bg-[#fa541c] text-white font-bold flex items-center justify-center text-xs">
                          1
                        </button>
                        <button className="h-6 px-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-400 rounded text-xs select-none flex items-center justify-center">
                          &gt;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 4. Interactive Storage Bucket Creator Modal (Page 101/89) */}
      {showCreateBucket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs select-none">
          <form
            onSubmit={handleCreateBucket}
            className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-xl relative text-slate-700"
          >
            <div className="absolute top-2.5 right-4 text-slate-400 font-mono text-[9px] uppercase">S3-COMPLIANT API CREATE_BUCKET</div>
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Database className="h-4.5 w-4.5 text-[#fa541c]" />
                <span>新建 ZOS 存储桶 (Create Storage Bucket)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateBucket(false)}
                className="text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Name input */}
              <div>
                <span className="text-slate-750 font-bold block mb-1 font-sans">1. 自定义唯一存储空间名 Bucket Name (创建后不可改):</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. ideal-survey-backups"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-[#fa541c]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">物理空间名称全局唯一，支持小写字母、数字、中划线，不可包含大写或重合。</span>
              </div>

              {/* Grid block params selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-750 font-semibold block mb-1">2. 物理承载数据地域 Region:</span>
                  <select
                    value={newBucketRegion}
                    onChange={(e) => setNewBucketRegion(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#fa541c]"
                  >
                    {REGIONS.map((reg) => (
                      <option key={reg.name} value={reg.name}>
                        {reg.name} ({reg.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-slate-750 font-semibold block mb-1">3. 首要存储类型 Class (可对各文件修改):</span>
                  <select
                    value={newBucketClass}
                    onChange={(e: any) => setNewBucketClass(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-[#fa541c]"
                  >
                    <option value="STANDARD">标准存储型 STANDARD (高频高性能)</option>
                    <option value="IA">低频访问型 IA (备份长期只读)</option>
                    <option value="ARCHIVE">便冷归档型 ARCHIVE (极低开销)</option>
                  </select>
                </div>
              </div>

              {/* Redundancy & ACL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-750 font-semibold block mb-1">4. 数据冗余备份策略:</span>
                  <div className="flex space-x-4 pt-1">
                    <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        checked={newBucketRedundancy === 'MULTI_AZ'}
                        onChange={() => setNewBucketRedundancy('MULTI_AZ')}
                        className="text-[#fa541c] focus:ring-0 cursor-pointer"
                      />
                      <span>多 AZ 冗余 (AZ 同步防灾)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        checked={newBucketRedundancy === 'SINGLE_AZ'}
                        onChange={() => setNewBucketRedundancy('SINGLE_AZ')}
                        className="text-[#fa541c] focus:ring-0 cursor-pointer"
                      />
                      <span>单 AZ 存储 (经济型)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-slate-750 font-semibold block mb-1">5. 存储桶访问控制权限 (ACL):</span>
                  <select
                    value={newBucketAcl}
                    onChange={(e: any) => setNewBucketAcl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#fa541c]"
                  >
                    <option value="private">私有 Private (仅桶白名单或拥有者可读写)</option>
                    <option value="public-read">公共读 Public-Read (任何人可解析下载，安全较低)</option>
                    <option value="public-read-write">⚠️ 公共读写 Public-Read-Write (高危！极不推荐)</option>
                  </select>
                </div>
              </div>

              {/* Enterprise Project selection */}
              <div>
                <span className="text-slate-750 font-semibold block mb-1">6. 关联企业级规划项目规划 (Enterprise Project Mapping):</span>
                <select
                  value={newBucketProject}
                  onChange={(e) => setNewBucketProject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-[#fa541c]"
                >
                  <option value="default">默认关联项目 (default)</option>
                  <option value="project-traffic">交通视频智能算力专案 (project-traffic)</option>
                  <option value="project-health">医疗高精度影像DICOM存储项目 (project-health)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateBucket(false)}
                className="bg-white border border-slate-300 text-slate-600 px-4 py-1.5 rounded-md cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-[#fa541c] hover:bg-[#e03d00] text-white font-bold px-5 py-1.5 rounded-md cursor-pointer transition-colors tracking-wide shadow-sm"
              >
                申购建立 Bucket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

