import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Database,
  FileCheck,
  Zap,
  Activity,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Key,
  Network,
  Cpu,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { AccessKey, ResourcePackage, BucketItem } from '../types';

interface OverviewProps {
  buckets: BucketItem[];
  resourcePackages: ResourcePackage[];
  setResourcePackages: React.Dispatch<React.SetStateAction<ResourcePackage[]>>;
  accessKeys: AccessKey[];
  setAccessKeys: React.Dispatch<React.SetStateAction<AccessKey[]>>;
}

export default function Overview({
  buckets,
  resourcePackages,
  setResourcePackages,
  accessKeys,
  setAccessKeys,
}: OverviewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSKMap, setShowSKMap] = useState<{ [key: string]: boolean }>({});
  
  // Custom states for buying resource package modal
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyType, setBuyType] = useState<'storage' | 'traffic' | 'requests'>('storage');
  const [buyRegion, setBuyRegion] = useState('长沙-公共资源池');
  const [buySpec, setBuySpec] = useState('50GB');
  const [buyClass, setBuyClass] = useState<'STANDARD' | 'IA'>('STANDARD');

  // Custom states for VPC configurations
  const [vpcList, setVpcList] = useState<{ id: string; vpcId: string; subnetId: string; region: string }[]>([
    { id: 'v-001', vpcId: 'vpc-cf30a', subnetId: 'subnet-cf30a', region: '广州-广州6' },
  ]);
  const [vpcIdInput, setVpcIdInput] = useState('vpc-ideal7a');
  const [subnetIdInput, setSubnetIdInput] = useState('subnet-ideal7a');
  const [vpcRegionInput, setVpcRegionInput] = useState('长沙-公共资源池');

  // Sparkline Chart simulation
  const [chartRange, setChartRange] = useState<'24h' | '7d'>('24h');

  // Compute stats metrics dynamically based on buckets list
  const totalBuckets = buckets.length;
  const totalFiles = buckets.reduce((acc, curr) => acc + (curr.quotaObjects || 12), 0); // dummy file aggregator
  const storageSum = buckets.reduce((acc, curr) => acc + (curr.quotaCapacity || 0), 0); // GB

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleAddVpc = () => {
    if (!vpcIdInput || !subnetIdInput) return;
    const newVpc = {
      id: `v-${Math.random().toString(36).substr(2, 4)}`,
      vpcId: vpcIdInput,
      subnetId: subnetIdInput,
      region: vpcRegionInput,
    };
    setVpcList([...vpcList, newVpc]);
    setVpcIdInput('vpc-');
    setSubnetIdInput('subnet-');
  };

  const handleDeleteVpc = (id: string) => {
    setVpcList(vpcList.filter((item) => item.id !== id));
  };

  // AK/SK Operations
  const handleCreateAKSK = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randString = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const newKey: AccessKey = {
      accessKeyId: 'AK' + randString(18),
      secretAccessKey: randString(28),
      status: 'active',
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAccessKeys([...accessKeys, newKey]);
  };

  const handleToggleKeyStatus = (id: string) => {
    setAccessKeys(
      accessKeys.map((k) => {
        if (k.accessKeyId === id) {
          return { ...k, status: k.status === 'active' ? 'inactive' : 'active' };
        }
        return k;
      })
    );
  };

  const handleDeleteKey = (id: string) => {
    setAccessKeys(accessKeys.filter((k) => k.accessKeyId !== id));
  };

  const handleBuyPackage = () => {
    const newPkg: ResourcePackage = {
      id: `pkg-${Math.random().toString(36).substr(2, 4)}`,
      type: buyType,
      name: `${buyType === 'storage' ? '标准存储' : buyType === 'traffic' ? '公网引流' : '通用请求'}流量包 (${buySpec})`,
      region: buyRegion,
      storageClass: buyType === 'storage' ? buyClass : undefined,
      spec: `${buySpec} 起订`,
      capacity: parseInt(buySpec) || 50,
      used: 0,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      expireTime: '2027-06-01 23:59:59',
      status: 'active',
    };
    setResourcePackages([...resourcePackages, newPkg]);
    setShowBuyModal(false);
  };

  return (
    <div className="space-y-6 select-none font-sans" id="overview-component">
      {/* 1. Quick Stats Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Core Stat 1 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">存储量总计 (Usage Sum)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{storageSum}.34</span>
              <span className="text-xs text-slate-400">GB</span>
            </div>
            <span className="text-[10px] text-[#f97316] font-sans mt-2 block">占可用总额限度 1.34%</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#f97316]/10 flex items-center justify-center border border-[#f97316]/20">
            <Database className="h-5 w-5 text-[#f97316]" />
          </div>
        </div>

        {/* Core Stat 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">存储桶总数 (Total Buckets)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{totalBuckets}</span>
              <span className="text-xs text-slate-400">个</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-sans mt-2 block">配额限度: 100个 / 地域</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        {/* Core Stat 3 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">模拟对象数量 (Total Objects)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{totalFiles}</span>
              <span className="text-xs text-slate-400">个</span>
            </div>
            <span className="text-[10px] text-blue-400 font-sans mt-2 block">平均多版本深度 1.25x</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <FileCheck className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        {/* Core Stat 4 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">本月 API 请求次数 (API Requests)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">9,537</span>
              <span className="text-xs text-slate-400">次</span>
            </div>
            <span className="text-[10px] text-purple-400 font-sans mt-2 block">写请求: 276次 | 读请求: 9231次</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
        </div>
      </section>

      {/* 2. Monitor Charts (Simulated via elegant responsive inline SVGs matching user manual) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="realtime-charts">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-orange-400" />
            <h3 className="text-xs font-bold text-white">ZOS 存储流量吞吐监控仪表盘 (Real-time Net Flow)</h3>
          </div>
          <div className="flex space-x-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
            <button
              onClick={() => setChartRange('24h')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                chartRange === '24h' ? 'bg-[#f97316] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              24小时实时 (Hourly)
            </button>
            <button
              onClick={() => setChartRange('7d')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                chartRange === '7d' ? 'bg-[#f97316] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              过去 7天汇总 (Weekly)
            </button>
          </div>
        </div>

        {/* Chart SVG Representation inside idealcloud container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Chart Left: Request frequencies */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 block font-sans">API 调用趋势曲线 [标准/低频访问/归档] (Request Trend, unit: counts)</span>
            <div className="relative h-40 bg-slate-950 rounded border border-slate-800 flex items-end p-2 px-6">
              {/* Fake grid lines */}
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-1/4"></div>
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-2/4"></div>
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-3/4"></div>

              {/* Responsive SVG representing waves */}
              <svg className="w-full h-full absolute inset-0 text-[#f97316]" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path
                  d="M 0,90 Q 20,40 40,75 T 80,25 T 100,5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="stroke-[#f97316]"
                />
                {/* Secondary data stream */}
                <path
                  d="M 0,80 Q 30,50 60,30 T 100,55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  className="stroke-emerald-400"
                />
              </svg>

              {/* Left axis titles */}
              <div className="absolute left-1 inset-y-1 select-none flex flex-col justify-between text-[9px] text-slate-600 font-mono">
                <span>1.2K</span>
                <span>800</span>
                <span>400</span>
                <span>0</span>
              </div>

              {/* Bottom labels */}
              <div className="absolute bottom-1 inset-x-6 flex justify-between text-[9px] text-slate-500 font-mono">
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>00:00</span>
                <span>{chartRange === '7d' ? '周日' : '15分钟后'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-[10px] pl-6 justify-start select-none">
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-3 bg-[#f97316] rounded-full inline-block"></span>
                <span className="text-slate-400">读取 API (GETs)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-3 bg-emerald-400 rounded-full inline-block border border-dashed"></span>
                <span className="text-slate-400">写入 API (PUTs)</span>
              </span>
            </div>
          </div>

          {/* Chart Right: Network ingress/egress */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 block font-sans">网关流出公网与跨区域同步同步带宽 (Network Egress, unit: Mbps)</span>
            <div className="relative h-40 bg-slate-950 rounded border border-slate-800 flex items-end p-2 px-6">
              {/* Fake grid lines */}
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-1/4"></div>
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-2/4"></div>
              <div className="absolute inset-x-0 h-[1px] bg-slate-850 top-3/4"></div>

              {/* Responsive SVG representing waves */}
              <svg className="w-full h-full absolute inset-0 text-sky-400" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path
                  d="M 0,85 Q 25,60 55,20 T 100,50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="stroke-sky-400"
                />
              </svg>

              {/* Left axis titles */}
              <div className="absolute left-1 inset-y-1 select-none flex flex-col justify-between text-[9px] text-slate-600 font-mono">
                <span>150MB</span>
                <span>100MB</span>
                <span>50MB</span>
                <span>0B</span>
              </div>

              {/* Bottom labels */}
              <div className="absolute bottom-1 inset-x-6 flex justify-between text-[9px] text-slate-500 font-mono">
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>00:00</span>
                <span>{chartRange === '7d' ? '周日' : '15分钟后'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-[10px] pl-6 justify-start select-none">
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-3 bg-sky-400 rounded-full inline-block"></span>
                <span className="text-slate-400">内网/公网流出流量 (Egress Outflow)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Resource Package Manager */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4.5 w-4.5 text-blue-400" />
            <h3 className="text-xs font-bold text-white">已购资源包与抵扣额度 (ACTIVE RESOURCE CONSOLE PACKAGES)</h3>
          </div>
          <button
            onClick={() => setShowBuyModal(true)}
            className="flex items-center space-x-1 bg-[#f97316] hover:bg-[#e25c00] text-white text-xs px-2.5 py-1.5 rounded cursor-pointer transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>购买资源包 (Stack Pack)</span>
          </button>
        </div>

        {/* Resource Packages layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resourcePackages.map((pkg) => {
            const usagePercent = Math.min(100, Math.round((pkg.used / pkg.capacity) * 100));
            return (
              <div key={pkg.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white font-bold">{pkg.name}</span>
                    <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono">
                      {pkg.type === 'storage' ? '存储抵扣' : pkg.type === 'traffic' ? '公网流出' : 'API频次'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono space-y-0.5 mb-3">
                    <div>所属地节点或可用池: {pkg.region}</div>
                    {pkg.storageClass && <div>限制类别: {pkg.storageClass === 'STANDARD' ? '标准存储型' : '低频访问型'}</div>}
                    <div>过期时间: {pkg.expireTime}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">已用量: {pkg.used} {pkg.type === 'requests' ? 'K次' : 'GB'}</span>
                    <span className="text-[#f97316]">{usagePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#f97316] h-full" style={{ width: `${usagePercent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Credentials & VPC network Mapping */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ACCESS KEY MANAGEMENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Key className="h-4.5 w-4.5 text-purple-400" />
              <h3 className="text-xs font-bold text-white">智算安全接口凭证秘钥管理 (AK/SK Access Keys)</h3>
            </div>
            <button
              onClick={handleCreateAKSK}
              className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] px-2 py-1 rounded cursor-pointer transition-colors"
            >
              新建 AccessKey
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 font-sans leading-relaxed">
            API/SDK 访问对象存储时所需的验证信息。一个账号支持生成多套秘钥。原生的旧秘钥失效不可找回，请妥善保存。
          </p>

          <div className="space-y-2 p-1 max-h-[220px] overflow-y-auto scrollbar-thin">
            {accessKeys.map((key) => {
              const isSKVisible = showSKMap[key.accessKeyId];
              return (
                <div key={key.accessKeyId} className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">创建时间: {key.createTime}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                        key.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {key.status === 'active' ? '启用状态' : '已禁用'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                    {/* AccessKeyId */}
                    <div className="bg-slate-900/60 p-1.5 rounded flex items-center justify-between overflow-hidden">
                      <span className="text-slate-500 mr-1 select-none">AK:</span>
                      <span className="text-slate-300 truncate select-all">{key.accessKeyId}</span>
                      <button
                        onClick={() => handleCopyText(key.accessKeyId, `ak-${key.accessKeyId}`)}
                        className="text-slate-500 hover:text-white ml-1 cursor-pointer"
                      >
                        {copiedKey === `ak-${key.accessKeyId}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* SecretAccessKey */}
                    <div className="bg-slate-900/60 p-1.5 rounded flex items-center justify-between overflow-hidden">
                      <span className="text-slate-500 mr-1 select-none">SK:</span>
                      <span className="text-slate-300 truncate select-all">
                        {isSKVisible ? key.secretAccessKey : '••••••••••••••••'}
                      </span>
                      <div className="flex items-center space-x-1 ml-1 select-none">
                        <button
                          onClick={() =>
                            setShowSKMap({ ...showSKMap, [key.accessKeyId]: !isSKVisible })
                          }
                          className="text-slate-500 hover:text-slate-300 text-[8px] border border-slate-800 px-1 py-0.5 rounded cursor-pointer"
                        >
                          {isSKVisible ? '隐藏' : '显示'}
                        </button>
                        <button
                          onClick={() => handleCopyText(key.secretAccessKey, `sk-${key.accessKeyId}`)}
                          className="text-slate-500 hover:text-white cursor-pointer"
                        >
                          {copiedKey === `sk-${key.accessKeyId}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toggle & delete */}
                  <div className="flex justify-end space-x-2 pt-1 border-t border-slate-900">
                    <button
                      onClick={() => handleToggleKeyStatus(key.accessKeyId)}
                      className="text-[10px] bg-slate-900 hover:bg-slate-850 px-2 py-0.5 rounded text-slate-300 cursor-pointer"
                    >
                      {key.status === 'active' ? '禁用该秘钥' : '启用该秘钥'}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.accessKeyId)}
                      className="text-[10px] text-red-500 hover:bg-red-500/10 px-2 py-0.5 rounded cursor-pointer"
                    >
                      删除秘钥
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VPC INTRANET CONNECTIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Network className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-xs font-bold text-white">VPC 专有网络内网互通接入 (Intranet Network Adapter)</h3>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 font-sans leading-relaxed">
            不同资源池/可用区容器服务器内网默认隔离不互通。在此处通过添加指定 VPC 及其子网（Subnet），可以让位于其上的云主机通过内网域名访问 ZOS 资源网段，节省公网带宽并降低延迟。
          </p>

          {/* VPC Creator */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 mb-1 block">VPC 专有网络 ID</span>
                <input
                  type="text"
                  value={vpcIdInput}
                  onChange={(e) => setVpcIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 select-all font-mono"
                />
              </div>
              <div>
                <span className="text-slate-500 mb-1 block">物理子网 Subnet ID</span>
                <input
                  type="text"
                  value={subnetIdInput}
                  onChange={(e) => setSubnetIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 select-all font-mono"
                />
              </div>
              <div>
                <span className="text-slate-500 mb-1 block">对应对象存储可用区地域</span>
                <select
                  value={vpcRegionInput}
                  onChange={(e) => setVpcRegionInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1"
                >
                  <option value="长沙-公共资源池">长沙-公共资源池</option>
                  <option value="华东-上海36">华东-上海36</option>
                  <option value="广东-广州6">广东-广州6</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddVpc}
                className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] px-3 py-1 rounded cursor-pointer transition-colors font-sans flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>配置内网联通 (Assign Subnet)</span>
              </button>
            </div>
          </div>

          {/* VPC List */}
          <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
            {vpcList.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-950 p-2 rounded text-[10px] font-mono border border-slate-900/50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-slate-300">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block"></span>
                    <span>{item.vpcId}</span>
                  </div>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{item.subnetId}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-[#f97316] font-sans">{item.region}</span>
                </div>
                <button
                  onClick={() => handleDeleteVpc(item.id)}
                  className="text-slate-500 hover:text-red-500 p-0.5 rounded cursor-pointer transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Purchase Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">申购ZOS存储及流量抵扣包</span>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <span className="text-slate-400 block mb-1">1. 资源包计费项类型:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'storage', label: '存储容量包' },
                    { val: 'traffic', label: '公网流量包' },
                    { val: 'requests', label: 'API 请求包' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setBuyType(t.val as any)}
                      className={`py-1.5 rounded text-center border font-sans cursor-pointer ${
                        buyType === t.val ? 'bg-orange-500 text-white border-orange-500 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <span className="text-slate-400 block mb-1">2. 所属地可用区节点:</span>
                  <select
                    value={buyRegion}
                    onChange={(e) => setBuyRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="长沙-公共资源池">长沙-公共资源池</option>
                    <option value="华东-上海36">华东-上海36</option>
                    <option value="广东-广州6">广东-广州6</option>
                    <option value="西南-成都4">西南-成都4</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">3. 抵扣额度规格:</span>
                  <select
                    value={buySpec}
                    onChange={(e) => setBuySpec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  >
                    {buyType === 'requests' ? (
                      <>
                        <option value="1万次">1 万次起</option>
                        <option value="5万次">5 万次</option>
                        <option value="10万次">10 万次</option>
                      </>
                    ) : (
                      <>
                        <option value="40GB">40 GB (起订)</option>
                        <option value="100GB">100 GB</option>
                        <option value="500GB">500 GB</option>
                        <option value="1TB">1 TB</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {buyType === 'storage' && (
                <div>
                  <span className="text-slate-400 block mb-1">4. 存储架构冗余类型:</span>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 text-slate-350 cursor-pointer">
                      <input
                        type="radio"
                        name="buyClass"
                        checked={buyClass === 'STANDARD'}
                        onChange={() => setBuyClass('STANDARD')}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span>标准存储型 (Standard)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-slate-350 cursor-pointer">
                      <input
                        type="radio"
                        name="buyClass"
                        checked={buyClass === 'IA'}
                        onChange={() => setBuyClass('IA')}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span>低频访问型 (IA)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowBuyModal(false)}
                className="bg-slate-800 text-slate-300 hover:text-white px-3.5 py-1.5 rounded cursor-pointer transition-colors font-sans"
              >
                取消
              </button>
              <button
                onClick={handleBuyPackage}
                className="bg-[#f97316] hover:bg-[#e25c00] text-white font-bold px-4 py-1.5 rounded cursor-pointer transition-colors shadow-lg shadow-orange-500/10"
              >
                确认订购 (Stack Now)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
