import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Upload,
  FolderPlus,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Globe,
  Settings,
  ArrowLeft,
  ChevronRight,
  Eye,
  Edit2,
  Sparkles,
  Play,
  RotateCw,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Code,
  Copy,
  Check,
  Activity,
  History,
  Terminal,
  ChevronDown,
  X
} from 'lucide-react';
import { BucketItem, ObjectItem, StorageClass, AclType, LifecycleRule } from '../types';
import ImageWorkshop from './ImageWorkshop';

interface BucketDetailsProps {
  bucket: BucketItem;
  bucketsList: BucketItem[];
  originObjects: { [bucketName: string]: ObjectItem[] };
  onBack: () => void;
  onUpdateBucket: (updatedBucket: BucketItem) => void;
}

export default function BucketDetails({
  bucket,
  bucketsList,
  originObjects,
  onBack,
  onUpdateBucket,
}: BucketDetailsProps) {
  // 1. Core States
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(''); // e.g. "docs/" or ""
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKeys, setSelectedKeys] = useState<{ [key: string]: boolean }>({});
  
  // Tab Switch (概览 | 文件管理 | 碎片管理 | 权限管理 | 基础设置 | 版本管理 | 日志管理)
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'multipart' | 'auth' | 'settings' | 'versions' | 'logging'>('overview');

  // Interactive local states
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [detailsFile, setDetailsFile] = useState<ObjectItem | null>(null);
  const [isClassEditing, setIsClassEditing] = useState(false);
  const [showImageWorkshop, setShowImageWorkshop] = useState<ObjectItem | null>(null);

  // --- Image 1 Custom File Actions ---
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  const [activeActionFile, setActiveActionFile] = useState<ObjectItem | null>(null);
  const [activeActionType, setActiveActionType] = useState<string | null>(null); // 'acl', 'tags', 'headers', 'symlink', 'copy', 'rename', 'share', 'class'

  // Form states for custom file action modals
  const [aclValue, setAclValue] = useState<AclType | 'default'>('default');
  const [objTags, setObjTags] = useState<{ key: string; value: string }[]>([]);
  const [inputTagKey, setInputTagKey] = useState<string>('');
  const [inputTagVal, setInputTagVal] = useState<string>('');
  const [inputHeaders, setInputHeaders] = useState<{ [key: string]: string }>({
    'Cache-Control': '',
    'Content-Disposition': '',
    'Content-Type': '',
    'Content-Encoding': '',
  });
  const [inputSymlink, setInputSymlink] = useState<string>('');
  const [inputCopyDest, setInputCopyDest] = useState<string>('');
  const [inputRename, setInputRename] = useState<string>('');
  const [inputShareExpiry, setInputShareExpiry] = useState<number>(3600);
  const [inputClass, setInputClass] = useState<StorageClass>('STANDARD');

  // --- Image 2 Custom Upload Modal ---
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadDestType, setUploadDestType] = useState<'current' | 'specified'>('current');
  const [uploadSpecifiedDir, setUploadSpecifiedDir] = useState<string>('');
  const [uploadAcl, setUploadAcl] = useState<'inherit' | 'private' | 'public-read'>('inherit');
  const [uploadedFileList, setUploadedFileList] = useState<{ name: string; size: number; isUploading?: boolean; progress?: number }[]>([]);
  const [showUploadAdvanced, setShowUploadAdvanced] = useState<boolean>(false);
  const [uploadAdvancedClass, setUploadAdvancedClass] = useState<StorageClass>('STANDARD');
  const [uploadAdvancedEncrypt, setUploadAdvancedEncrypt] = useState<'none' | 'KMS' | 'ZOS'>('none');

  // Multipart uploads state
  const [showMultipartSim, setShowMultipartSim] = useState(false);
  const [multipartProgress, setMultipartProgress] = useState(0);
  const [multipartStatus, setMultipartStatus] = useState<'idle' | 'uploading' | 'paused' | 'completed'>('idle');

  // Referer, Policy and WORM retention setup state
  const [refererWhitelistInput, setRefererWhitelistInput] = useState(bucket.referer.whitelist.join('\n'));
  const [refererBlacklistInput, setRefererBlacklistInput] = useState(bucket.referer.blacklist.join('\n'));
  const [testRefererHeader, setTestRefererHeader] = useState('https://console.ctyun.cn');
  const [refererTestResult, setRefererTestResult] = useState<'allowed' | 'blocked' | 'none'>('none');

  const [policyEffect, setPolicyEffect] = useState<'Allow' | 'Deny'>('Allow');
  const [policyPrincipal, setPolicyPrincipal] = useState('*');
  const [policyAction, setPolicyAction] = useState('GetObject');
  const [policyResource, setPolicyResource] = useState(`${bucket.name}/*`);
  const [bucketPolicyJSON, setBucketPolicyJSON] = useState('');

  const [lcName, setLcName] = useState('');
  const [lcType, setLcType] = useState<'prefix' | 'entire'>('prefix');
  const [lcPrefix, setLcPrefix] = useState('');
  const [lcIaDays, setLcIaDays] = useState(30);
  const [lcArcDays, setLcArcDays] = useState(90);
  const [lcExpDays, setLcExpDays] = useState(365);
  const [wormDaysInput, setWormDaysInput] = useState(bucket.worm.retentionDays);

  // Versioning and Access log settings
  const [versioningEnabled, setVersioningEnabled] = useState(true);
  const [showHistoryVersions, setShowHistoryVersions] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [loggingBucket, setLoggingBucket] = useState('logs-retention-store');
  const [loggingPrefix, setLoggingPrefix] = useState('zos-access-logs/');

  // Initial objects loading
  useEffect(() => {
    const cached = localStorage.getItem(`zos_objects_${bucket.name}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setObjects(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached zos_objects:", e);
      }
    }
    const defaultValue = Array.isArray(originObjects[bucket.name]) ? originObjects[bucket.name] : [];
    setObjects(defaultValue);
    localStorage.setItem(`zos_objects_${bucket.name}`, JSON.stringify(defaultValue));
  }, [bucket.name, originObjects]);

  const saveObjects = (newObjects: ObjectItem[]) => {
    setObjects(newObjects);
    localStorage.setItem(`zos_objects_${bucket.name}`, JSON.stringify(newObjects));
  };

  // Generate policies on change
  useEffect(() => {
    const template = {
      Version: '2026-06-01',
      Statement: [
        {
          Sid: 'ZosConsoleStrategyGenerator-001',
          Effect: policyEffect,
          Principal: policyPrincipal === '*' ? '*' : { AWS: [`arn:ctyun:iam::user:${policyPrincipal}`] },
          Action: [`zos:${policyAction}`],
          Resource: [`arn:ctyun:zos:::${policyResource}`],
        },
      ],
    };
    setBucketPolicyJSON(JSON.stringify(template, null, 2));
  }, [policyEffect, policyPrincipal, policyAction, policyResource, bucket.name]);

  // Toast status alert helper
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`📋 ${label} 复制成功：${text}`);
  };

  // Directory parsing helper
  const getSubFoldersAndFiles = () => {
    const filesInCurrentPath: { [name: string]: { type: 'file' | 'folder'; key: string; item?: ObjectItem } } = {};
    objects.forEach((obj) => {
      if (obj.key.startsWith(currentPath) && obj.key !== currentPath) {
        const remaining = obj.key.substring(currentPath.length);
        const slashIdx = remaining.indexOf('/');
        if (slashIdx !== -1) {
          const folderName = remaining.substring(0, slashIdx + 1);
          const folderFullKey = currentPath + folderName;
          filesInCurrentPath[folderName] = { type: 'folder', key: folderFullKey };
        } else {
          filesInCurrentPath[remaining] = { type: 'file', key: obj.key, item: obj };
        }
      }
    });

    return Object.entries(filesInCurrentPath)
      .map(([name, val]) => ({ name, ...val }))
      .filter((item) => {
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
  };

  const displayItems = getSubFoldersAndFiles();

  // Create physical mocked folder placeholder Object
  const handleAddFolder = () => {
    if (!newFolderName) return;
    const normalizedName = newFolderName.endsWith('/') ? newFolderName : `${newFolderName}/`;
    const folderKey = currentPath + normalizedName;

    const folderObject: ObjectItem = {
      key: folderKey,
      name: normalizedName,
      folder: currentPath,
      size: 0,
      lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19),
      storageClass: bucket.storageClass,
      ownerId: 'owner-理想12',
      etag: 'd41d8cd98f00b204e9800998ecf8427e',
      contentType: 'application/x-directory',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'null',
          isLatest: true,
          size: 0,
          lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19),
          storageClass: bucket.storageClass,
        }
      ]
    };

    saveObjects([...objects, folderObject]);
    setNewFolderName('');
    setShowAddFolder(false);
    triggerToast('新建空文件夹对象成功！');
  };

  // Mock standard fast files upload
  const handleUploadPreset = (presetType: 'excel' | 'image' | 'video') => {
    if (bucket.worm.locked) {
      alert('存储桶已锁定合规 WORM 保留策略，操作已被安全内核拦截防篡改。');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let key = currentPath;
    let name = '';
    let size = 0;
    let cType = '';

    if (presetType === 'excel') {
      name = `销售账单统计_idealcloud_${Math.round(Math.random() * 1000)}.xlsx`;
      key += name;
      size = 45520;
      cType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (presetType === 'image') {
      name = `idealcloud_background_${Math.round(Math.random() * 100)}.png`;
      key += name;
      size = 285400;
      cType = 'image/png';
    } else {
      name = `视频监控归档_surveillance_${Math.round(Math.random() * 100)}.mp4`;
      key += name;
      size = 12480000;
      cType = 'video/mp4';
    }

    const duplicateIdx = objects.findIndex((o) => o.key === key);
    let updatedList = [...objects];
    const generateVersionId = () => Math.random().toString(36).substr(2, 6);

    if (duplicateIdx !== -1) {
      const existing = objects[duplicateIdx];
      // Push new version
      const newVer = {
        versionId: 'v-' + generateVersionId(),
        isLatest: true,
        size,
        lastModified: nowStr,
        storageClass: bucket.storageClass,
      };
      const updatedVersions = existing.versions.map(v => ({ ...v, isLatest: false }));
      updatedVersions.unshift(newVer);
      existing.versions = updatedVersions;
      existing.size = size;
      existing.lastModified = nowStr;
      updatedList[duplicateIdx] = existing;
    } else {
      const newObj: ObjectItem = {
        key,
        name,
        folder: currentPath,
        size,
        lastModified: nowStr,
        storageClass: bucket.storageClass,
        ownerId: 'owner-理想12',
        etag: Math.random().toString(16).substring(2, 10),
        contentType: cType,
        acl: 'default',
        tags: [],
        versions: [
          {
            versionId: 'null',
            isLatest: true,
            size,
            lastModified: nowStr,
            storageClass: bucket.storageClass,
          }
        ]
      };
      updatedList.push(newObj);
    }

    saveObjects(updatedList);
    triggerToast(`成功流式上传预置文件对象: ${name}`);
  };

  // Safe individual delete task
  const handleDeleteObject = (objectKey: string) => {
    if (bucket.worm.locked) {
      alert('⚠️ 该存储桶配置了 WORM 合规强制锁，锁定保护期内无法物理删除此数据。');
      return;
    }
    const updated = objects.filter((o) => o.key !== objectKey);
    saveObjects(updated);
    if (detailsFile?.key === objectKey) {
      setDetailsFile(null);
    }
    triggerToast('文件对象物理擦除销毁完成');
  };

  const handleDeleteFolder = (folderKey: string) => {
    if (bucket.worm.locked) {
      alert('⚠️ 该存储桶配置了 WORM 合规强制锁，锁定保护期内无法物理删除此数据。');
      return;
    }
    const confirmDelete = window.confirm(`是否确定要删除目录 "${folderKey}" 及其下的所有文件对象？此操作不可逆。`);
    if (!confirmDelete) return;

    const updated = objects.filter((o) => !o.key.startsWith(folderKey));
    saveObjects(updated);

    const updatedSelections = { ...selectedKeys };
    Object.keys(updatedSelections).forEach((key) => {
      if (key.startsWith(folderKey)) {
        delete updatedSelections[key];
      }
    });
    setSelectedKeys(updatedSelections);

    triggerToast(`目录 "${folderKey}" 及其下的所有关联对象已成功删除。`);
  };

  // Restore history point back to active最新
  const handleRestoreVersion = (fileKey: string, verId: string) => {
    const updated = objects.map((obj) => {
      if (obj.key === fileKey) {
        const nextVersions = obj.versions.map((v) => ({
          ...v,
          isLatest: v.versionId === verId,
        }));
        const target = obj.versions.find((v) => v.versionId === verId);
        if (target) {
          obj.size = target.size;
          obj.storageClass = target.storageClass;
        }
        obj.versions = nextVersions;
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast('历史版本还原节点成功！');
  };

  // Bulk batch actions
  const handleBatchDelete = () => {
    if (bucket.worm.locked) {
      alert('⚠️ 存储桶处于合规 WORM 强制锁定限制，批量物理清除被内核防篡改策略拒绝。');
      return;
    }
    const keysToDelete = Object.keys(selectedKeys).filter((k) => selectedKeys[k]);
    if (keysToDelete.length === 0) return;

    if (confirm(`确定要物理彻底删除选中的 ${keysToDelete.length} 个文件对象吗？该操作在云端不可逆。`)) {
      const updated = objects.filter((o) => !selectedKeys[o.key]);
      saveObjects(updated);
      setSelectedKeys({});
      setDetailsFile(null);
      triggerToast('批量清理选中有价对象成功！');
    }
  };

  const handleRenameObject = (oldKey: string) => {
    if (bucket.worm.locked) {
      alert('WORM 安全控制拦截：当前拒绝重命名写操作。');
      return;
    }
    const rawName = oldKey.replace(currentPath, '');
    const newName = prompt('请输入重命名的新文件名名称:', rawName);
    if (!newName) return;

    const targetKey = currentPath + newName;
    const updated = objects.map((obj) => {
      if (obj.key === oldKey) {
        return { ...obj, key: targetKey, name: newName };
      }
      return obj;
    });
    saveObjects(updated);
    setDetailsFile(null);
    triggerToast('对象名物理重命名生效！');
  };

  // Thaw / Restore Archive file objects
  const handleThawArchive = (objectKey: string, days: number = 7) => {
    const updated = objects.map((obj) => {
      if (obj.key === objectKey) {
        obj.restoreStatus = 'restoring';
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast('启动归档文件异步温热解冻线程(OSD Read Pre-fetch)...');

    setTimeout(() => {
      const thawedList = objects.map((o) => {
        if (o.key === objectKey) {
          o.restoreStatus = 'restored';
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + days);
          o.restoreExpiryTime = expDate.toISOString().replace('T', ' ').substring(0, 19);
        }
        return o;
      });
      saveObjects(thawedList);
      triggerToast('解冻归档大包准备完毕！当前临时温和保存在 OSD 高频 SSD 存储池。');
    }, 1500);
  };

  // Tag & Class edits
  const handleModifyObjClass = (objectKey: string, targetClass: StorageClass) => {
    const updated = objects.map((obj) => {
      if (obj.key === objectKey) {
        obj.storageClass = targetClass;
        obj.versions = obj.versions.map(v => v.isLatest ? { ...v, storageClass: targetClass } : v);
      }
      return obj;
    });
    saveObjects(updated);
    setIsClassEditing(false);
    if (detailsFile) {
      setDetailsFile({ ...detailsFile, storageClass: targetClass });
    }
    triggerToast('物理存储类别属性修改转换成功！');
  };

  const handleAddObjectTag = (key: string, value: string) => {
    if (!detailsFile) return;
    const tagMatch = detailsFile.tags.findIndex(t => t.key === key);
    let updatedTags = [...detailsFile.tags];
    if (tagMatch !== -1) {
      updatedTags[tagMatch] = { key, value };
    } else {
      updatedTags.push({ key, value });
    }

    const updated = objects.map(o => {
      if (o.key === detailsFile.key) {
        o.tags = updatedTags;
      }
      return o;
    });
    saveObjects(updated);
    setDetailsFile({ ...detailsFile, tags: updatedTags });
    triggerToast('添加元数据防伪标签标签对成功！');
  };

  // --- Image 1 Custom More Dropdown Confirmations ---
  const handleTriggerActionModal = (file: ObjectItem, action: string) => {
    setActiveActionFile(file);
    setActiveActionType(action);
    setActiveDropdownKey(null); // 关闭下拉菜单
    
    // 初始化属性数据
    if (action === 'acl') {
      setAclValue(file.acl || 'default');
    } else if (action === 'tags') {
      setObjTags(file.tags || []);
      setInputTagKey('');
      setInputTagVal('');
    } else if (action === 'headers') {
      setInputHeaders({
        'Cache-Control': 'max-age=86400, public',
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': file.contentType || 'application/octet-stream',
        'Content-Encoding': '',
      });
    } else if (action === 'symlink') {
      const dotIdx = file.name.lastIndexOf('.');
      const hasExt = dotIdx >= 0;
      const base = hasExt ? file.name.substring(0, dotIdx) : file.name;
      setInputSymlink(`${base}_link.lnk`);
    } else if (action === 'copy') {
      const idx = file.name.lastIndexOf('.');
      const base = idx >= 0 ? file.name.substring(0, idx) : file.name;
      const ext = idx >= 0 ? file.name.substring(idx) : '';
      setInputCopyDest(`${base}_copy${ext}`);
    } else if (action === 'rename') {
      setInputRename(file.name);
    } else if (action === 'share') {
      setInputShareExpiry(3600);
    } else if (action === 'class') {
      setInputClass(file.storageClass);
    }
  };

  const handleCopyUrl = (file: ObjectItem) => {
    const url = `https://${bucket.name}.jiangsu-10.zos.ctyun.cn/${file.key}`;
    navigator.clipboard.writeText(url);
    triggerToast(`📋 已将文件 "${file.name}" 的 ZOS 访问链接复制至剪贴板！`);
  };

  const handleDownloadObject = (file: ObjectItem) => {
    triggerToast(`📥 触发浏览器下载：正在从江苏10区ZOS存储池获取对象 "${file.name}"`);
    // Create mock download anchor
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmAcl = () => {
    if (!activeActionFile) return;
    const updated = objects.map((obj) => {
      if (obj.key === activeActionFile.key) {
        return { ...obj, acl: aclValue };
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast(`✅ 设置读写权限成功："${activeActionFile.name}" 已设为 ${aclValue}`);
    setActiveActionFile(null);
    setActiveActionType(null);
  };

  const handleConfirmTags = () => {
    if (!activeActionFile) return;
    const updated = objects.map((obj) => {
      if (obj.key === activeActionFile.key) {
        return { ...obj, tags: objTags };
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast(`✅ 对象标签更新成功！`);
    setActiveActionFile(null);
    setActiveActionType(null);
  };

  const handleConfirmHeaders = () => {
    if (!activeActionFile) return;
    triggerToast(`✅ 成功为 "${activeActionFile.name}" 应用重写 HTTP 属性头！`);
    setActiveActionFile(null);
    setActiveActionType(null);
  };

  const handleConfirmSymlink = () => {
    if (!activeActionFile || !inputSymlink) return;
    const symKey = currentPath + inputSymlink;
    const newSym: ObjectItem = {
      key: symKey,
      name: inputSymlink,
      folder: currentPath,
      size: 0,
      lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19),
      storageClass: activeActionFile.storageClass,
      ownerId: activeActionFile.ownerId,
      etag: 'symlink-etag',
      contentType: 'application/x-symlink',
      acl: 'default',
      tags: [{ key: 'target', value: activeActionFile.key }],
      versions: [{ versionId: 'v-sym', isLatest: true, size: 0, lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19), storageClass: activeActionFile.storageClass }]
    };
    saveObjects([...objects, newSym]);
    triggerToast(`✅ 软链接创建成功！关联目标："${activeActionFile.name}"`);
    setActiveActionFile(null);
    setActiveActionType(null);
    setInputSymlink('');
  };

  const handleConfirmCopy = () => {
    if (!activeActionFile || !inputCopyDest) return;
    let destKey = inputCopyDest;
    if (!destKey.includes('/')) {
      destKey = currentPath + destKey;
    }
    const destName = destKey.substring(destKey.lastIndexOf('/') + 1) || destKey;
    
    const duplicate: ObjectItem = {
      ...activeActionFile,
      key: destKey,
      name: destName,
      lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19),
      versions: [
        {
          versionId: 'v-' + Math.random().toString(36).substr(2, 6),
          isLatest: true,
          size: activeActionFile.size,
          lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19),
          storageClass: activeActionFile.storageClass
        }
      ]
    };
    saveObjects([...objects, duplicate]);
    triggerToast(`✅ 对象复制成功！生成新对象："${destName}"`);
    setActiveActionFile(null);
    setActiveActionType(null);
    setInputCopyDest('');
  };

  const handleConfirmRename = () => {
    if (!activeActionFile || !inputRename) return;
    const oldKey = activeActionFile.key;
    const newName = inputRename;
    const newKey = activeActionFile.key.substring(0, activeActionFile.key.lastIndexOf('/') + 1) + newName;
    const updated = objects.map((obj) => {
      if (obj.key === oldKey) {
        return {
          ...obj,
          key: newKey,
          name: newName,
          lastModified: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast(`✅ 文件重命名完成！新文件名：${newName}`);
    setActiveActionFile(null);
    setActiveActionType(null);
    setInputRename('');
  };

  const handleConfirmShare = () => {
    triggerToast(`✅ 授权分享通道建立成功！已生成临时签名链接（有效期：${inputShareExpiry} 秒）。`);
    setActiveActionFile(null);
    setActiveActionType(null);
  };

  const handleConfirmClass = () => {
    if (!activeActionFile) return;
    const updated = objects.map((obj) => {
      if (obj.key === activeActionFile.key) {
        return {
          ...obj,
          storageClass: inputClass,
          versions: obj.versions.map(v => v.isLatest ? { ...v, storageClass: inputClass } : v)
        };
      }
      return obj;
    });
    saveObjects(updated);
    triggerToast(`✅ 修改存储类型成功！修改为：${inputClass === 'STANDARD' ? '标准存储' : inputClass === 'IA' ? '低频访问型' : '便冷归档型'}`);
    setActiveActionFile(null);
    setActiveActionType(null);
  };

  // --- Image 2 Custom Upload Simulation ---
  const handleStartSimulatedUpload = () => {
    // Collect files
    let filesToUpload = [...uploadedFileList];
    // If empty list, we automatically pre-populate two realistic files as requested in Image 2
    if (filesToUpload.length === 0) {
      filesToUpload = [
        { name: '品牌LOGO.png', size: 15247, status: 'pending', progress: 0 } as any,
        { name: '产品演示规格书.pdf', size: 124800, status: 'pending', progress: 0 } as any,
      ];
    }

    setUploadedFileList(filesToUpload.map(f => ({ ...f, isUploading: true, progress: 0 })));

    // Simulating progress upload
    let currentPercent = 0;
    const interval = setInterval(() => {
      currentPercent += 10;
      setUploadedFileList(prev =>
        prev.map(f => ({
          ...f,
          progress: Math.min(currentPercent, 100),
          isUploading: currentPercent < 100
        }))
      );

      if (currentPercent >= 100) {
        clearInterval(interval);
        
        // Finalize state merge
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const destinationFolder = uploadDestType === 'current' ? currentPath : (uploadSpecifiedDir.endsWith('/') ? uploadSpecifiedDir : uploadSpecifiedDir + '/');
        
        const finalNewObjects = filesToUpload.map((f, index) => {
          const finalKey = destinationFolder + f.name;
          const objectAclValue = uploadAcl === 'inherit' ? 'default' : uploadAcl as any;
          const finalClass = showUploadAdvanced ? uploadAdvancedClass : bucket.storageClass;
          const tagsList = showUploadAdvanced && uploadAdvancedEncrypt !== 'none' 
            ? [{ key: 'SSE_Encryption', value: uploadAdvancedEncrypt }] 
            : [];

          return {
            key: finalKey,
            name: f.name,
            folder: destinationFolder,
            size: f.size,
            lastModified: nowStr,
            storageClass: finalClass,
            ownerId: 'owner-理想12',
            etag: Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
            contentType: f.name.endsWith('.png') ? 'image/png' : f.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            acl: objectAclValue,
            tags: tagsList,
            versions: [
              {
                versionId: 'v-' + Math.random().toString(36).substr(2, 6),
                isLatest: true,
                size: f.size,
                lastModified: nowStr,
                storageClass: finalClass,
              }
            ]
          };
        });

        // Add to existing objects list, overwriting duplicate keys
        const updatedObjects = [...objects];
        finalNewObjects.forEach(newObj => {
          const dupIdx = updatedObjects.findIndex(o => o.key === newObj.key);
          if (dupIdx !== -1) {
            updatedObjects[dupIdx] = newObj;
          } else {
            updatedObjects.push(newObj);
          }
        });

        saveObjects(updatedObjects);
        triggerToast(`🎉 成功上传 ${filesToUpload.length} 个文件到 ZOS 目录！`);
        setShowUploadModal(false);
        setUploadedFileList([]);
        setUploadSpecifiedDir('');
      }
    }, 150);
  };

  // Referer, SSE and settings updates
  const handleSaveRefererConfig = () => {
    const listWhite = refererWhitelistInput.split('\n').map(s => s.trim()).filter(Boolean);
    const listBlack = refererBlacklistInput.split('\n').map(s => s.trim()).filter(Boolean);

    const updatedBucket = {
      ...bucket,
      referer: {
        ...bucket.referer,
        whitelist: listWhite,
        blacklist: listBlack,
      },
    };
    onUpdateBucket(updatedBucket);
    triggerToast('存储桶防盗链白名单/黑名单保存生效！');
  };

  const handleToggleSse = (enabled: boolean) => {
    const updatedBucket = {
      ...bucket,
      encryption: {
        ...bucket.encryption,
        enabled,
      },
    };
    onUpdateBucket(updatedBucket);
    triggerToast(enabled ? '服务端自动 KM 硬件级别加密护持启用成功' : '静态块数据明文落盘(不推荐)');
  };

  const handleWormDaysConfig = () => {
    const updatedBucket = {
      ...bucket,
      worm: {
        ...bucket.worm,
        retentionDays: wormDaysInput,
      },
    };
    onUpdateBucket(updatedBucket);
    alert('WORM机制保护期修正成功！当前为 ' + wormDaysInput + ' 天内置顶保护。');
  };

  // Lifecycle Rule Management
  const handleAddLifecycleRule = () => {
    if (!lcName) return;
    const newRule: LifecycleRule = {
      id: `lc-${Math.random().toString(36).substr(2, 4)}`,
      name: lcName,
      status: 'enabled',
      filterType: lcType,
      prefix: lcType === 'prefix' ? lcPrefix : undefined,
      currentVersionTransition: {
        iaDays: lcIaDays || undefined,
        archiveDays: lcArcDays || undefined,
        expireDays: lcExpDays || undefined,
      },
    };

    const updatedBucket = {
      ...bucket,
      lifecycleRules: [...bucket.lifecycleRules, newRule],
    };
    onUpdateBucket(updatedBucket);
    setLcName('');
    setLcPrefix('');
    triggerToast('提交并部署生命周期成本计算规则成功！');
  };

  const handleDeleteLifecycleRule = (id: string) => {
    const updatedBucket = {
      ...bucket,
      lifecycleRules: bucket.lifecycleRules.filter(r => r.id !== id),
    };
    onUpdateBucket(updatedBucket);
    triggerToast('生命周期清除归档规则成功');
  };

  const handleValidateRefererHeader = () => {
    if (!testRefererHeader) {
      setRefererTestResult(bucket.referer.allowEmpty ? 'allowed' : 'blocked');
      return;
    }
    let urlObj: URL;
    try {
      urlObj = new URL(testRefererHeader);
    } catch {
      setRefererTestResult('blocked');
      return;
    }
    const host = urlObj.hostname;
    const isBlacklisted = bucket.referer.blacklist.some((blocked) => {
      const reg = blocked.replace(/\*/g, '.*');
      return new RegExp(`^${reg}$`).test(host);
    });

    if (isBlacklisted) {
      setRefererTestResult('blocked');
      return;
    }

    if (bucket.referer.whitelist.length > 0) {
      const isWhitelisted = bucket.referer.whitelist.some((allowed) => {
        const reg = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${reg}$`).test(host);
      });
      setRefererTestResult(isWhitelisted ? 'allowed' : 'blocked');
    } else {
      setRefererTestResult('allowed');
    }
  };

  const handleBeginMultipartSimulation = () => {
    setMultipartProgress(0);
    setMultipartStatus('uploading');

    let current = 0;
    const timer = setInterval(() => {
      current += Math.round(Math.random() * 12) + 5;
      if (current >= 100) {
        current = 100;
        setMultipartStatus('completed');
        clearInterval(timer);

        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const multipartUploadedFile: ObjectItem = {
          key: currentPath + `ZOS_大数据集_分片归档_${Math.round(Math.random() * 100)}.tar`,
          name: `ZOS_大数据集_分片归档_${Math.round(Math.random() * 100)}.tar`,
          folder: currentPath,
          size: 48512000000,
          lastModified: nowStr,
          storageClass: bucket.storageClass,
          ownerId: 'owner-理想12',
          etag: Math.random().toString(16).substring(2, 10),
          contentType: 'application/x-tar',
          acl: 'default',
          tags: [{ key: 'uploadMode', value: 'Multipart' }],
          versions: [
            {
              versionId: 'null',
              isLatest: true,
              size: 48512000000,
              lastModified: nowStr,
              storageClass: bucket.storageClass,
            }
          ]
        };
        saveObjects([...objects, multipartUploadedFile]);
        triggerToast('分片并发极速上传已合并，并在 ZOS 目录生成 45.1GB 超大归档包！');
      } else {
        setMultipartProgress(current);
      }
    }, 120);
  };

  const handleAclToggle = (targetAcl: AclType) => {
    const updatedBucket = {
      ...bucket,
      acl: targetAcl,
    };
    onUpdateBucket(updatedBucket);
    triggerToast(`读写权限 (ACL) 已变更为: ${targetAcl === 'private' ? '私有' : targetAcl === 'public-read' ? '公共读' : '公共读写'}`);
  };

  // Helper storage formatter
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalCalculatedSize = objects.reduce((sum, obj) => sum + obj.size, 0);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans text-xs pb-10" id="ideal-zos-bucket-details">
      {/* Toast Alert Banner */}
      {toastMsg && (
        <div className="fixed top-5 right-5 bg-slate-900 border border-slate-700 text-white px-4.5 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Header breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 mb-6 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-1 px-3 py-1.5 rounded-md bg-white border border-slate-250 hover:bg-slate-50 hover:text-slate-950 transition-colors flex items-center space-x-1.5 cursor-pointer text-slate-600 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs">返回存储池</span>
          </button>
          
          <div className="h-4 w-[1px] bg-slate-200"></div>

          <div className="flex items-center space-x-2 text-slate-500 font-normal">
            <span className="hover:text-slate-800 cursor-pointer">基础资源</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-700 font-medium hover:text-slate-950 cursor-pointer">对象存储 (ZOS)</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">{bucket.name}</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-4 text-[11px] font-medium text-slate-500">
          <div>存储桶地域: <span className="text-orange-600 font-bold font-sans">{bucket.region}</span></div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <div>存储类型: <span className="text-slate-900 font-semibold">{bucket.storageClass === 'STANDARD' ? '标准存储' : '低频/归档'}</span></div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <div>WORM保留期: {bucket.worm.locked ? <span className="text-red-500 font-bold">已启用合规锁</span> : <span className="text-slate-400">未启用</span>}</div>
        </div>
      </div>

      <div className="px-6 max-w-7xl mx-auto">
        {/* Render main image Processing panel overlay */}
        {showImageWorkshop ? (
          <ImageWorkshop
            currentBucketName={bucket.name}
            selectedFile={showImageWorkshop}
            onClose={() => setShowImageWorkshop(null)}
          />
        ) : (
          <>
            {/* 1. 基本信息 panel (from mockup) */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6 relative">
              <div className="text-sm font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-1 bg-[#fa541c] rounded"></div>
                  <span className="text-sm text-slate-950 font-bold">基本信息</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8 text-xs text-slate-600">
                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">Bucket名称</span>
                  <div className="flex items-center space-x-1 font-mono text-slate-900">
                    <span className="font-bold">{bucket.name}</span>
                    <button 
                      onClick={() => handleCopyText(bucket.name, 'Bucket名称')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">创建时间</span>
                  <span className="font-mono text-slate-900">{bucket.createTime || '2026-05-19 15:19:47'}</span>
                </div>

                <div className="flex items-start lg:col-span-2">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">ARN</span>
                  <div className="flex items-center space-x-1 font-mono text-slate-800 break-all select-all">
                    <span>arn:aws:s3:::{bucket.name}</span>
                    <button 
                      onClick={() => handleCopyText(`arn:aws:s3:::{bucket.name}`, 'ARN')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">冗余策略</span>
                  <span className="text-slate-900 font-medium">{bucket.redundancy === 'MULTI_AZ' ? '多AZ存储(单可用区高灾备)' : '单AZ存储(经济型)'}</span>
                </div>

                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">存储类型</span>
                  <span className="text-slate-900 font-medium">
                    {bucket.storageClass === 'STANDARD' ? '标准存储' : bucket.storageClass === 'IA' ? '低频访问' : '归档存储'}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">地域</span>
                  <span className="text-slate-900 font-mono font-bold text-orange-600">{bucket.region}</span>
                </div>

                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0 font-medium">读写权限</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    bucket.acl === 'private' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                  }`}>
                    {bucket.acl === 'private' ? '私有' : bucket.acl === 'public-read' ? '公共读' : '公共读写'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Horizontal Menu Sub Tab List */}
            <div className="flex space-x-1 border-b border-slate-200 mb-6 bg-white rounded-t-lg shadow-xs overflow-x-auto select-none">
              {[
                { id: 'overview', label: '概览' },
                { id: 'files', label: '文件管理' },
                { id: 'multipart', label: '碎片管理' },
                { id: 'auth', label: '权限管理' },
                { id: 'settings', label: '基础设置' },
                { id: 'versions', label: '版本管理' },
                { id: 'logging', label: '日志管理' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#fa541c] text-[#fa541c] bg-[#fa541c]/5 shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-805 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3. Panel Switch Render */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Domain info row */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">域名信息</h3>
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">类型</th>
                        <th className="py-2.5 px-3">域名</th>
                        <th className="py-2.5 px-3 text-center w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">终端节点 (Endpoint) <HelpCircle className="h-3 w-3 inline text-slate-400 cursor-pointer" /></td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">https://jiangsu-10.zos.ctyun.cn</td>
                        <td className="py-2.5 px-3 text-center">
                          <button onClick={() => handleCopyText('https://jiangsu-10.zos.ctyun.cn', '终端节点')} className="text-xs text-blue-600 hover:underline cursor-pointer">复制</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Bucket外网访问 <HelpCircle className="h-3 w-3 inline text-slate-400 cursor-pointer" /></td>
                        <td className="py-2.5 px-3 font-mono text-slate-650 font-medium">https://{bucket.name}.jiangsu-10.zos.ctyun.cn</td>
                        <td className="py-2.5 px-3 text-center">
                          <button onClick={() => handleCopyText(`https://${bucket.name}.jiangsu-10.zos.ctyun.cn`, 'Bucket外网访问')} className="text-xs text-blue-600 hover:underline cursor-pointer">复制</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">同资源池内网访问 (IPv4) <HelpCircle className="h-3 w-3 inline text-slate-400 cursor-pointer" /></td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">http://jiangsu-10-internal.zos.ctyun.cn</td>
                        <td className="py-2.5 px-3 text-center">
                          <button onClick={() => handleCopyText('http://jiangsu-10-internal.zos.ctyun.cn', '内网IPv4')} className="text-xs text-blue-600 hover:underline cursor-pointer">复制</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">同资源池内网访问 (IPv6) <HelpCircle className="h-3 w-3 inline text-slate-400 cursor-pointer" /></td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">100:2:0:3:0:0:647b:8841</td>
                        <td className="py-2.5 px-3 text-center">
                          <button onClick={() => handleCopyText('100:2:0:3:0:0:647b:8841', '内网IPv6')} className="text-xs text-blue-600 hover:underline cursor-pointer">复制</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Basic metrics statistics layout cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-lg border border-slate-200 relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-xs transition-shadow">
                    <div>
                      <span className="text-slate-400 block font-sans text-xs mb-1 font-medium">存储用量</span>
                      <span className="text-2xl font-black text-slate-950 font-mono">{formatBytes(totalCalculatedSize)}</span>
                    </div>
                    {/* Cloud graphics absolute layout decor */}
                    <div className="absolute right-3 bottom-1">
                      <Globe className="h-14 w-14 text-slate-105 opacity-15 stroke-1" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-xs transition-shadow">
                    <div>
                      <span className="text-slate-400 block font-sans text-xs mb-1 font-medium">文件数量</span>
                      <span className="text-2xl font-black text-slate-950 font-mono flex items-center">{objects.length} <span className="text-xs text-[#fa541c] ml-2 font-sans font-bold">↗</span></span>
                    </div>
                    <div className="absolute right-3 bottom-1">
                      <FolderOpen className="h-14 w-14 text-slate-105 opacity-15 stroke-1" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-xs transition-shadow">
                    <div>
                      <span className="text-slate-400 block font-sans text-xs mb-1 font-medium">文件碎片统计</span>
                      <span className="text-2xl font-black text-slate-950 font-mono flex items-center">0 <span className="text-xs text-[#fa541c] ml-2 font-sans font-bold">↗</span></span>
                    </div>
                    <div className="absolute right-3 bottom-0.5">
                      <Sparkles className="h-14 w-14 text-slate-105 opacity-15 stroke-1" />
                    </div>
                  </div>
                </div>

                {/* Hourly metrics read write traffic chart indicators */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 select-none pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <button className="bg-blue-600 text-white font-medium px-4 py-1.5 rounded text-xs">本月</button>
                      <button className="bg-white border border-slate-250 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-xs">上月</button>
                      <span className="text-[11px] text-slate-400 ml-2">
                        以下统计数据非实时数据，存在一定的延迟，仅供参考。具体指标解释请查看 <span className="text-blue-600 hover:underline cursor-pointer">数据说明</span>。
                      </span>
                    </div>
                    <button className="p-1 px-2 border border-slate-250 rounded hover:bg-slate-55 transition-colors">
                      <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-150 py-3 text-slate-705">
                    <div className="flex items-center space-x-3.5 p-3 select-none">
                      <Activity className="h-6 w-6 text-slate-450 shrink-0" />
                      <div>
                        <span className="text-slate-450 block text-[10px]">请求次数 (读)</span>
                        <span className="text-lg font-black font-mono text-slate-900">21 <span className="text-xs font-normal text-slate-400">次</span></span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3.5 p-3 select-none">
                      <Activity className="h-6 w-6 text-slate-450 shrink-0" />
                      <div>
                        <span className="text-slate-450 block text-[10px]">请求次数 (写)</span>
                        <span className="text-lg font-black font-mono text-slate-900">0 <span className="text-xs font-normal text-slate-400">次</span></span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3.5 p-3 select-none">
                      <Upload className="h-6 w-6 text-slate-450 shrink-0" />
                      <div>
                        <span className="text-slate-450 block text-[10px]">公网流入流量</span>
                        <span className="text-lg font-black font-mono text-slate-900">0 B</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3.5 p-3 select-none">
                      <Upload className="h-6 w-6 text-slate-450 shrink-0" />
                      <div>
                        <span className="text-slate-450 block text-[10px]">公网流出流量</span>
                        <span className="text-lg font-black font-mono text-slate-900">0 B</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common dashboard setup shortcuts links directly to tags target tab */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">常用设置</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">读写权限</span>
                        <span className="text-slate-900 font-bold text-xs">{bucket.acl === 'private' ? '私有' : '公共'}</span>
                      </div>
                      <button onClick={() => setActiveTab('auth')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">生命周期</span>
                        <span className="text-slate-900 font-bold text-xs">{bucket.lifecycleRules.length > 0 ? `已设置(${bucket.lifecycleRules.length}条)` : '未设置'}</span>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">跨域访问</span>
                        <span className="text-slate-900 font-bold text-xs">已设置</span>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">日志管理</span>
                        <span className="text-slate-900 font-bold text-xs">{loggingEnabled ? '已启用监控' : '未设置'}</span>
                      </div>
                      <button onClick={() => setActiveTab('logging')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">防盗链</span>
                        <span className="text-slate-900 font-bold text-xs">{bucket.referer.whitelist.length > 0 ? '已启用限制' : '未设置'}</span>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">版本控制</span>
                        <span className="text-slate-900 font-bold text-xs">{versioningEnabled ? '已开通' : '失效'}</span>
                      </div>
                      <button onClick={() => setActiveTab('versions')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">服务端加密</span>
                        <span className="text-slate-900 font-bold text-xs">{bucket.encryption.enabled ? '开启 KMS' : '关闭'}</span>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>

                    <div className="bg-white p-4.5 rounded-lg border border-slate-200 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">防重叠保障 (WORM)</span>
                        <span className="text-slate-900 font-bold text-xs">{bucket.worm.locked ? '核物理合规安全锁定' : '未生效'}</span>
                      </div>
                      <button onClick={() => setActiveTab('settings')} className="text-[11px] border border-slate-200 text-blue-600 hover:bg-slate-50 px-2.5 py-1 rounded-md">设置</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Standard folder and S3 objects browser explorer */}
            {activeTab === 'files' && (
              <div className="space-y-4" id="tab-zos-files-explorer">
                {/* File Operation Bar styled according to Image 1 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                  <div className="flex items-center space-x-2">
                    {/* 上传文件 button (styled like Image 1) */}
                    <button
                      onClick={() => {
                        setShowUploadModal(true);
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-850 border border-slate-300 px-4 py-1.5 rounded cursor-pointer text-xs font-semibold flex items-center space-x-1 shadow-sm h-8"
                    >
                      <span>上传文件</span>
                    </button>

                    {/* 新建目录 button (styled like Image 1) */}
                    <button
                      onClick={() => setShowAddFolder(!showAddFolder)}
                      className="bg-white hover:bg-slate-50 text-slate-850 border border-slate-300 px-4 py-1.5 rounded cursor-pointer text-xs font-semibold flex items-center space-x-1 shadow-sm h-8"
                    >
                      <span>新建目录</span>
                    </button>

                    {/* 删除 button (styled like Image 1, disabled unless checked) */}
                    <button
                      disabled={!Object.values(selectedKeys).some(Boolean)}
                      onClick={handleBatchDelete}
                      className={`px-4 py-1.5 rounded text-xs font-semibold shadow-sm h-8 border ${
                        Object.values(selectedKeys).some(Boolean)
                          ? 'bg-white hover:bg-slate-50 text-red-600 border-slate-300 cursor-pointer'
                          : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <span>删除</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="请输入文件名前缀"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-slate-300 rounded-sm pl-2.5 pr-8 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 w-[240px] h-8 font-sans"
                      />
                      <div className="absolute right-2.5 top-2.5 text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    {/* Refresh button */}
                    <button
                      onClick={() => {
                        const cached = localStorage.getItem(`zos_objects_${bucket.name}`);
                        if (cached) setObjects(JSON.parse(cached));
                        triggerToast('🔄 已重新刷新当前目录视图！');
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 p-1.5 rounded-sm flex items-center justify-center cursor-pointer shadow-sm h-8 w-8"
                      title="刷新"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add folder container */}
                {showAddFolder && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center space-x-3 select-none">
                    <span className="text-slate-500 font-semibold font-sans">拟建文件夹名:</span>
                    <div className="flex bg-slate-50 border border-slate-250 rounded overflow-hidden flex-1 font-mono items-center">
                      <div className="bg-slate-100 px-2 py-1 text-slate-500 select-none">{currentPath}</div>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="例如 report-pdf"
                        className="flex-1 px-3 bg-transparent text-slate-805 text-xs focus:outline-none"
                      />
                      <div className="bg-slate-100 px-2 py-1 text-slate-500">/</div>
                    </div>
                    <button onClick={handleAddFolder} className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded cursor-pointer text-xs">提交</button>
                    <button onClick={() => setShowAddFolder(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                  </div>
                )}

                {/* Path display matching Image 1: "根目录" */}
                <div className="flex items-center justify-between py-1 px-1 text-slate-700 select-none bg-slate-50/20 rounded border border-transparent">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold">
                    <button onClick={() => setCurrentPath('')} className="hover:text-blue-600 font-sans font-bold">根目录</button>
                    {currentPath && (
                      <>
                        <span className="text-slate-400">/</span>
                        <span className="text-blue-600 font-bold font-sans">{currentPath}</span>
                      </>
                    )}
                  </div>
                  {/* Slider or arrow icon wrapper on extreme right to mimic Image 1 */}
                  <div className="flex items-center justify-center p-1 border border-slate-200 rounded-full h-6 w-6 cursor-pointer bg-white hover:bg-slate-50">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Statistics of storage class count in the current directory */}
                {(() => {
                  const filesUnderDir = objects.filter(
                    (obj) =>
                      obj.key.startsWith(currentPath) &&
                      obj.key !== currentPath &&
                      obj.contentType !== 'application/x-directory'
                  );

                  const stats = {
                    STANDARD: 0,
                    IA: 0,
                    ARCHIVE: 0,
                    totalCount: filesUnderDir.length,
                    totalSize: 0,
                  };

                  filesUnderDir.forEach((obj) => {
                    const sc = obj.storageClass || 'STANDARD';
                    if (sc === 'STANDARD') stats.STANDARD++;
                    else if (sc === 'IA') stats.IA++;
                    else if (sc === 'ARCHIVE') stats.ARCHIVE++;
                    stats.totalSize += obj.size || 0;
                  });

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 select-none flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs animate-fadeIn">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700">
                        <span className="font-bold text-slate-800 flex items-center space-x-1 shrink-0">
                          <span className="w-1.5 h-3 bg-[#fa541c] rounded-sm inline-block"></span>
                          <span>当前目录储量统计 [{currentPath || '根目录'}]：</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-xs text-[11px]">
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-slate-500">标准存储:</span>
                            <strong className="text-slate-800">{stats.STANDARD}</strong>
                            <span className="text-slate-400">个</span>
                          </span>
                          <span className="text-slate-200">|</span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-slate-500">低频访问型:</span>
                            <strong className="text-slate-800">{stats.IA}</strong>
                            <span className="text-slate-405">个</span>
                          </span>
                          <span className="text-slate-200">|</span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-slate-500">归档存储:</span>
                            <strong className="text-slate-800">{stats.ARCHIVE}</strong>
                            <span className="text-slate-405">个</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono shrink-0">
                        <div>
                          对象数: <strong className="text-slate-800 font-sans">{stats.totalCount}</strong> 个
                        </div>
                        <span className="text-slate-300">|</span>
                        <div>
                          总大小: <strong className="text-slate-800 font-sans">{(stats.totalSize / 1024).toFixed(2)}</strong> KB
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Desktop File table listings - Full Width layout */}
                <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse text-slate-755 font-sans table-fixed">
                    <thead>
                      <tr className="bg-[#f5f7fa] text-slate-600 border-b border-slate-200 font-semibold text-xs select-none h-10">
                        <th className="py-2.5 pl-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentFiles = displayItems.filter(i => i.type === 'file');
                              const nextSelections = { ...selectedKeys };
                              currentFiles.forEach(f => {
                                if (f.item) nextSelections[f.item.key] = checked;
                              });
                              setSelectedKeys(nextSelections);
                            }}
                          />
                        </th>
                        <th className="py-2.5 pl-2 font-medium w-[40%]">文件名称</th>
                        <th className="py-2.5 font-medium w-[15%]">存储类型</th>
                        <th className="py-2.5 font-medium w-[12%]">文件大小</th>
                        <th className="py-2.5 font-medium w-[18%]">更新时间</th>
                        <th className="py-2.5 font-medium w-[15%] text-left pl-4">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {currentPath && (
                        <tr className="hover:bg-slate-50/50">
                          <td></td>
                          <td colSpan={5} className="py-2.5 pl-2">
                            <button onClick={() => {
                              const segments = currentPath.split('/');
                              segments.pop();
                              segments.pop();
                              setCurrentPath(segments.length > 0 ? segments.join('/') + '/' : '');
                            }} className="text-blue-600 font-bold flex items-center space-x-1.5 focus:outline-none cursor-pointer text-xs">
                              <FolderOpen className="h-4 w-4 text-blue-500" />
                              <span>返回上一级目录 (Parent)</span>
                            </button>
                          </td>
                        </tr>
                      )}

                      {displayItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs select-none">
                            该目录分项下未发现任何文件对象。请点击左上方【上传文件】添加您的数据。
                          </td>
                        </tr>
                      ) : (
                        displayItems.map((item) => {
                          const isFolder = item.type === 'folder';
                          return (
                            <React.Fragment key={item.key}>
                              <tr className="hover:bg-[#f6f8fb]/80 text-slate-700 text-xs transition-colors h-11 border-b border-slate-100">
                                <td className="py-3 text-center">
                                  {!isFolder && (
                                    <input
                                      type="checkbox"
                                      checked={!!selectedKeys[item.key]}
                                      onChange={(e) => {
                                        setSelectedKeys({ ...selectedKeys, [item.key]: e.target.checked });
                                      }}
                                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5"
                                    />
                                  )}
                                </td>
                                <td className="py-3 pl-2 max-w-[40%]">
                                  {isFolder ? (
                                    <button
                                      onClick={() => {
                                        setCurrentPath(item.key);
                                        setSearchQuery('');
                                      }}
                                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-2 focus:outline-none text-left cursor-pointer animate-fadeIn"
                                    >
                                      <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
                                      <span className="truncate">{item.name}</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center space-x-2 w-full animate-fadeIn">
                                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                      <button
                                        onClick={() => setDetailsFile(item.item || null)}
                                        className="hover:text-blue-600 font-medium text-slate-800 focus:outline-none text-left truncate text-xs cursor-pointer font-sans"
                                        title={item.name}
                                      >
                                        {item.name}
                                      </button>
                                      <button
                                        onClick={() => handleCopyUrl(item.item!)}
                                        className="text-slate-400 hover:text-blue-600 focus:outline-none shrink-0 p-0.5"
                                        title="复制下载链接"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 font-sans text-slate-700 text-xs text-left">
                                  {isFolder ? '--' : item.item?.storageClass === 'STANDARD' ? '标准存储' : item.item?.storageClass === 'IA' ? '低频访问型' : item.item?.storageClass === 'ARCHIVE' ? '便冷归档型' : item.item?.storageClass}
                                </td>
                                <td className="py-3 font-sans text-slate-600 text-left">
                                  {isFolder ? '--' : item.item ? `${(item.item.size / 1024).toFixed(2)} KB` : '0 KB'}
                                </td>
                                <td className="py-3 font-sans text-slate-500 text-left">
                                  {isFolder ? '--' : item.item?.lastModified}
                                </td>
                                <td className="py-3 text-left pl-4 select-none relative">
                                  {isFolder ? (
                                    <div className="flex items-center space-x-3 text-xs">
                                      <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded shrink-0">目录</span>
                                      <button
                                        onClick={() => handleDeleteFolder(item.key)}
                                        className="text-[#fa541c] hover:text-red-750 hover:underline cursor-pointer font-medium"
                                        title={`删除目录 ${item.name}`}
                                      >
                                        删除
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-3 text-xs">
                                      <button
                                        onClick={() => handleDownloadObject(item.item!)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                      >
                                        下载
                                      </button>
                                      <button
                                        onClick={() => handleDeleteObject(item.key)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                      >
                                        删除
                                      </button>
                                      
                                      {/* Dropdown container */}
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdownKey(activeDropdownKey === item.key ? null : item.key);
                                          }}
                                          className="text-blue-600 hover:text-blue-850 hover:underline cursor-pointer font-medium flex items-center space-x-0.5"
                                        >
                                          <span>更多</span>
                                          <ChevronDown className="h-3 w-3 shrink-0" />
                                        </button>

                                        {/* Dropdown Menu block exactly mimicking Image 1 */}
                                        {activeDropdownKey === item.key && (
                                          <>
                                            <div
                                              className="fixed inset-0 z-40"
                                              onClick={() => setActiveDropdownKey(null)}
                                            ></div>
                                            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 font-sans text-slate-705 animate-fadeIn text-[11px] select-none text-left">
                                              <button
                                                onClick={() => {
                                                  handleCopyUrl(item.item!);
                                                  setActiveDropdownKey(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                复制URL
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'acl')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                设置读写权限
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'tags')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                标签
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'headers')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                设置HTTP头
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'symlink')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                创建软链接
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'copy')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                复制
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'rename')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                重命名
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'share')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                分享
                                              </button>
                                              <button
                                                onClick={() => handleTriggerActionModal(item.item!, 'class')}
                                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                修改存储类型
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Footer Styled exactly as in Image 1 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 select-none text-xs text-slate-500">
                    <div className="flex items-center space-x-1 font-sans">
                      <span>共 {displayItems.length} 条记录</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <select className="border border-slate-300 rounded px-1.5 py-1 text-slate-700 bg-white text-xs outline-none focus:border-blue-500">
                          <option value="10">10条/页</option>
                          <option value="20">20条/页</option>
                          <option value="50">50条/页</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-450 cursor-pointer">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-450 cursor-pointer">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* --- Image 2 Custom Upload Modal ---    */}
            {/* ======================================= */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 overflow-y-auto antialiased select-none font-sans">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 animate-zoomIn flex flex-col my-8">
                  {/* Title Bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150">
                    <h3 className="text-sm font-bold text-slate-900">上传文件</h3>
                    <button onClick={() => setShowUploadModal(false)} className="text-slate-450 hover:text-slate-750 p-1 rounded-full cursor-pointer hover:bg-slate-100 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs text-slate-700">
                    {/* 上传到 */}
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-slate-600">上传到:</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setUploadDestType('current')}
                          className={`px-4 py-1.5 border text-xs font-semibold rounded transition-all cursor-pointer ${
                            uploadDestType === 'current'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-755 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          当前目录
                        </button>
                        <button
                          onClick={() => setUploadDestType('specified')}
                          className={`px-4 py-1.5 border text-xs font-semibold rounded transition-all cursor-pointer ${
                            uploadDestType === 'specified'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-755 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          指定目录
                        </button>
                      </div>
                    </div>

                    {/* Specified directory input */}
                    {uploadDestType === 'specified' && (
                      <div className="flex items-center pl-24 animate-fadeIn">
                        <div className="flex items-center bg-slate-50 border border-slate-300 rounded overflow-hidden flex-1 max-w-md">
                          <span className="bg-slate-150/80 px-2.5 py-1 text-slate-500 select-none">/</span>
                          <input
                            type="text"
                            placeholder="例如 archives/or-backups"
                            value={uploadSpecifiedDir}
                            onChange={(e) => setUploadSpecifiedDir(e.target.value)}
                            className="bg-transparent px-3 py-1.5 text-xs text-slate-800 outline-none flex-1 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* 读写权限 */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <span className="w-24 font-semibold text-slate-600">读写权限:</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setUploadAcl('inherit')}
                            className={`px-4 py-1.5 border text-xs font-semibold rounded transition-all cursor-pointer ${
                              uploadAcl === 'inherit'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-755 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            继承Bucket
                          </button>
                          <button
                            onClick={() => setUploadAcl('private')}
                            className={`px-4 py-1.5 border text-xs font-semibold rounded transition-all cursor-pointer ${
                              uploadAcl === 'private'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-755 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            私有
                          </button>
                          <button
                            onClick={() => setUploadAcl('public-read')}
                            className={`px-4 py-1.5 border text-xs font-semibold rounded transition-all cursor-pointer ${
                              uploadAcl === 'public-read'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-755 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            公共读
                          </button>
                        </div>
                      </div>
                      
                      {/* Explainer note */}
                      <p className="pl-24 text-slate-450 leading-relaxed text-[11px] pt-1">
                        {uploadAcl === 'inherit' && '对象的读写权限与 Bucket 的读写权限一致。'}
                        {uploadAcl === 'private' && '对象的读写权限设为私有。仅所有者享有读写访问权。'}
                        {uploadAcl === 'public-read' && '对象的读写权限设为公共读。任何外部客户端均可免密访问、读取该对象。'}
                      </p>
                    </div>

                    {/* Drag-and-Drop Area */}
                    <div className="relative border border-dashed border-blue-400 bg-slate-50/20 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:bg-slate-50/50 transition-colors">
                      {/* Standard cartoon logo of ZOS blue folders mimicking Image 2 */}
                      <div className="flex flex-col items-center justify-center relative">
                        <div className="h-16 w-20 bg-blue-500 rounded-lg shadow-md flex items-end justify-center pb-2 relative z-10 border border-blue-600">
                          {/* Folder pocket drawer */}
                          <div className="bg-blue-600 h-8 w-18 rounded border-t border-blue-400 absolute bottom-0 left-1 flex items-center justify-center shadow-inner">
                            <span className="h-1 w-4 bg-blue-700 rounded-full block"></span>
                          </div>
                          {/* Slipped out Document white sheet */}
                          <div className="bg-white border border-slate-200 h-12 w-10 absolute top-[-10px] left-5 rotate-3 shadow z-0 p-1 flex flex-col space-y-1">
                            <span className="h-1 w-6 bg-slate-200 rounded block"></span>
                            <span className="h-1 w-8 bg-slate-100 rounded block"></span>
                            <span className="h-1 w-5 bg-slate-150 rounded block"></span>
                          </div>
                        </div>
                      </div>

                      {/* Warnings banner mimicking Image 2 */}
                      <div className="bg-amber-50 rounded px-4 py-2 text-amber-700/90 border border-amber-200/50 flex items-center space-x-2 text-[11px] leading-relaxed max-w-lg">
                        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                        <span>严禁传播诈骗、色情、暴力及其他侵犯他人权利或违反法律及公序良俗内容</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 cursor-pointer font-medium hover:text-blue-600">
                          <span>拖拽本地文件或文件夹至此处，或点击 </span>
                          <span className="text-blue-600 font-bold hover:underline">直接上传</span>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const list = [];
                                for (let i = 0; i < e.target.files.length; i++) {
                                  list.push({ name: e.target.files[i].name, size: e.target.files[i].size, progress: 0 });
                                }
                                setUploadedFileList(list);
                              }
                            }}
                          />
                        </label>
                        <p className="text-slate-400 text-[11px]">单次最多支持 100 个文件上传，单个文件最大 5 GB</p>
                      </div>

                      {/* Display of currently chosen files waiting for upload */}
                      {uploadedFileList.length > 0 && (
                        <div className="w-full bg-white border border-slate-200 rounded p-3 text-left space-y-1.5 animate-fadeIn max-h-40 overflow-y-auto">
                          <span className="text-slate-500 font-bold block text-[10px] uppercase">待上传文件队列：</span>
                          {uploadedFileList.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                              <div className="truncate pr-4 flex-1">
                                <span className="font-semibold text-slate-800 shrink-0">{f.name}</span>
                                <span className="text-slate-400 font-mono text-[10px] pl-2">({(f.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              {f.progress && f.progress > 0 ? (
                                <div className="flex items-center space-x-2 shrink-0">
                                  <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all" style={{ width: `${f.progress}%` }}></div>
                                  </div>
                                  <span className="font-mono text-blue-600 font-bold text-[10px]">{f.progress}%</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setUploadedFileList(uploadedFileList.filter((_, idx) => idx !== i))}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                                >
                                  移除
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Accordion view: 高级选项 */}
                    <div className="border border-slate-200 rounded overflow-hidden select-none">
                      <button
                        onClick={() => setShowUploadAdvanced(!showUploadAdvanced)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 px-4 py-2.5 flex items-center justify-between font-bold text-slate-800 relative cursor-pointer"
                      >
                        <span>高级选项</span>
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showUploadAdvanced ? 'rotate-180' : ''}`} />
                      </button>

                      {showUploadAdvanced && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-4 animate-fadeIn">
                          {/* Storage Class Selector */}
                          <div className="flex items-center">
                            <span className="w-24 font-semibold text-slate-600">默认存储类型:</span>
                            <div className="flex space-x-2">
                              {(['STANDARD', 'IA', 'ARCHIVE'] as StorageClass[]).map((sc) => (
                                <button
                                  key={sc}
                                  onClick={() => setUploadAdvancedClass(sc)}
                                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${
                                    uploadAdvancedClass === sc
                                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {sc === 'STANDARD' ? '标准存储' : sc === 'IA' ? '低频访问' : '归档冷存储'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* SSE Server Side Encryption Custom Key */}
                          <div className="flex items-center">
                            <span className="w-24 font-semibold text-slate-600">静态加密:</span>
                            <div className="flex space-x-2">
                              {(['none', 'KMS', 'ZOS'] as const).map((enc) => (
                                <button
                                  key={enc}
                                  onClick={() => setUploadAdvancedEncrypt(enc)}
                                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${
                                    uploadAdvancedEncrypt === enc
                                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {enc === 'none' ? '关闭/无' : enc === 'KMS' ? 'SSE-KMS (中国电信国密Key)' : 'SSE-ZOS (托管密钥)'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guidelines and Rules block mimicking Image 2 */}
                    <div className="space-y-1.5 pt-1 text-slate-450 border-t border-slate-100 leading-relaxed scale-95 origin-left">
                      <p className="font-semibold text-slate-500">文件上传规则：</p>
                      <p>1、文件名区分大小写。</p>
                      <p>2、文件名长度必须在 1-1023 字节之间。</p>
                      <p>3、除非以文件夹形式上传，否则文件名中不能包含 / 或 \ 字符。</p>
                      <p>4、Bucket 下若存在同名文件，将被新上传的文件覆盖。</p>
                    </div>
                  </div>

                  {/* Buttons Action Bar */}
                  <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-150 rounded-b-lg space-x-3">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadedFileList([]);
                      }}
                      className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded cursor-pointer text-xs transition-colors h-9"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleStartSimulatedUpload}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer text-xs shadow transition-colors h-9"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* --- Image 3 Custom File Details Modal - */}
            {/* ======================================= */}
            {detailsFile && (
              <div className="fixed inset-0 bg-black/60 z-[998] flex items-center justify-center p-4 overflow-y-auto antialiased font-sans">
                <div className="bg-white rounded shadow-2xl w-full max-w-4xl border border-slate-200 animate-zoomIn flex flex-col my-4">
                  {/* Title Bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150">
                    <h3 className="text-sm font-bold text-slate-900">
                      {detailsFile.name}详情
                    </h3>
                    <button
                      onClick={() => setDetailsFile(null)}
                      className="text-slate-400 hover:text-slate-705 p-1 rounded-full cursor-pointer hover:bg-slate-100 transition-all font-bold font-sans text-xs focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">
                    {/* Visual Preview Box */}
                    <div className="border border-slate-200 bg-[#fbfcfd] rounded p-12 flex flex-col items-center justify-center min-h-[220px]">
                      {detailsFile.name === '品牌LOGO.png' || detailsFile.contentType.startsWith('image/') ? (
                        <div className="flex items-center justify-center space-x-5 animate-fadeIn">
                          {/* Beautiful svg double curved cloud shaped precisely matching mock-up */}
                          <div className="flex items-center space-x-4 bg-white p-6 rounded border border-slate-100 shadow-sm">
                            <svg className="w-16 h-16 text-[#FA541C]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M25 65 C12 65 10 48 20 40 C18 24 38 15 48 25 C58 8 82 12 80 32 C92 32 95 48 82 58"
                                stroke="#FA541C"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="#FA541C"
                                fillOpacity="0.05"
                              />
                              <path
                                d="M22 65 Q50 82 78 65"
                                stroke="#FA541C"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M26 55 Q50 72 74 55"
                                stroke="#FA541C"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M50 54 L50 72"
                                stroke="#FA541C"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="text-3xl font-bold text-[#FA541C] tracking-wide font-sans select-none">
                              智云实训平台
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-fadeIn text-slate-500">
                          <div className="p-4 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center text-blue-500">
                            <FileText className="h-16 w-16 text-blue-500" />
                          </div>
                          <span className="font-semibold text-sm text-slate-700">{detailsFile.name}</span>
                          <span className="text-xs text-slate-400">该文件类型不支持在线可视化渲染</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata specs - Double columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-[13px] text-slate-805 border-b border-slate-100 pb-5">
                      {/* Left column */}
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">文件名称：</span>
                          <span className="font-medium break-all text-slate-800">{detailsFile.name}</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">S3 URI：</span>
                          <span className="font-mono text-slate-650 break-all select-all">s3://{bucket.name}/{detailsFile.key}</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">存储类型：</span>
                          <span className="text-slate-800">
                            {detailsFile.storageClass === 'STANDARD' ? '标准存储' :
                             detailsFile.storageClass === 'IA' ? '低频访问型' :
                             detailsFile.storageClass === 'ARCHIVE' ? '便冷归档型' : detailsFile.storageClass}
                          </span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">读写权限：</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-800">
                              {detailsFile.acl === 'private' ? '私有' :
                               detailsFile.acl === 'public-read' ? '公共读' :
                               detailsFile.acl === 'public-read-write' ? '公共读写' : '私有'}
                            </span>
                            <button
                              onClick={() => {
                                handleTriggerActionModal(detailsFile, 'acl');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-all ml-1"
                            >
                              设置读写权限
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">更新时间：</span>
                          <span className="font-mono text-slate-800">{detailsFile.lastModified}</span>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">文件大小：</span>
                          <span className="font-mono text-slate-800">{(detailsFile.size / 1024).toFixed(2)} KB</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">版本信息：</span>
                          <span className="text-slate-400 font-mono">--</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">ETag：</span>
                          <span className="font-mono break-all text-slate-600">"{detailsFile.etag}"</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">文件类型：</span>
                          <span className="font-mono text-slate-800">{detailsFile.contentType}</span>
                        </div>

                        <div className="flex items-start">
                          <span className="w-24 text-slate-500 shrink-0">标签：</span>
                          <button
                            onClick={() => {
                              handleTriggerActionModal(detailsFile, 'tags');
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-all"
                          >
                            设置标签
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secondary rows below columns */}
                    <div className="text-[13px] text-slate-800 space-y-4 pt-1">
                      <div className="flex flex-col md:flex-row md:items-start">
                        <span className="w-24 text-slate-500 shrink-0">URL：</span>
                        <div className="flex-1 flex flex-wrap items-center gap-x-3.5 gap-y-1">
                          <span className="text-slate-605 font-mono break-all select-all">
                            https://jiangsu-10.zos.ctyun.cn/{bucket.name}/{detailsFile.key}
                          </span>
                          <div className="flex items-center space-x-2.5 shrink-0 select-none text-xs">
                            <button
                              onClick={() => handleCopyUrl(detailsFile)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            >
                              复制URL
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleDownloadObject(detailsFile)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            >
                              下载
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => {
                                handleTriggerActionModal(detailsFile, 'share');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            >
                              分享
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="w-24 text-slate-500 shrink-0">服务端加密：</span>
                        <span className="text-slate-800">无</span>
                      </div>

                      <div className="flex items-start">
                        <span className="w-24 text-slate-500 shrink-0">复制状态：</span>
                        <span className="text-slate-400 font-mono">--</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Close Actions */}
                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-150 flex justify-end">
                    <button
                      onClick={() => setDetailsFile(null)}
                      className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-xs rounded transition-all cursor-pointer shadow-sm"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* --- Image 1 Custom More Action Modals -- */}
            {/* ======================================= */}
            {activeActionFile && activeActionType && (
              <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 overflow-y-auto select-none font-sans">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 animate-zoomIn flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-150">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      {activeActionType === 'acl' && '设置读写权限 (Set ACL)'}
                      {activeActionType === 'tags' && '分类防伪标签 (Object Tags)'}
                      {activeActionType === 'headers' && '重写 http 属性头 (Set Headers)'}
                      {activeActionType === 'symlink' && '创建软链接 (Create Symlink)'}
                      {activeActionType === 'copy' && '复制文件对象 (Copy Object)'}
                      {activeActionType === 'rename' && '重命名对象 (Rename Object)'}
                      {activeActionType === 'share' && '授权分享链接 (Share Object)'}
                      {activeActionType === 'class' && '修改物理存储类型 (Modify Storage Class)'}
                    </h3>
                    <button
                      onClick={() => {
                        setActiveActionFile(null);
                        setActiveActionType(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer hover:bg-slate-100 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 text-xs text-slate-750 space-y-4">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-150 flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-slate-450 shrink-0" />
                      <div className="truncate flex-1">
                        <span className="text-slate-400 uppercase text-[9px] font-bold block leading-none mb-0.5">操作目标文件</span>
                        <span className="text-xs text-slate-800 font-bold truncate break-all">{activeActionFile.name}</span>
                      </div>
                    </div>

                    {/* Action form fields */}
                    {activeActionType === 'acl' && (
                      <div className="space-y-3">
                        <span className="font-semibold text-slate-600 block">选择文件的授权读写权限:</span>
                        <div className="flex flex-col space-y-2">
                          {(['default', 'private', 'public-read'] as const).map((acl) => (
                            <label key={acl} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded border border-slate-150 cursor-pointer transition-colors text-xs">
                              <input
                                type="radio"
                                name="acl-choice"
                                checked={aclValue === acl}
                                onChange={() => setAclValue(acl)}
                                className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <div>
                                <span className="font-bold text-slate-800 uppercase">
                                  {acl === 'default' ? '默认 (继承 Bucket)' : acl === 'private' ? '私有 (Private)' : '公共读 (Public Read)'}
                                </span>
                                <p className="text-[10px] text-slate-450 mt-0.5">
                                  {acl === 'default' && '与存储桶的主ACL属性完全保持一致：' + bucket.acl}
                                  {acl === 'private' && '只有该 ZOS Bucket 账户或有权凭证可写入或读出'}
                                  {acl === 'public-read' && '任何人均可通过 HTTP 链接直接读取此静态文件'}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeActionType === 'tags' && (
                      <div className="space-y-3">
                        <span className="font-semibold text-slate-600 block">分类对象标签列表:</span>
                        <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 border border-slate-150 rounded">
                          {objTags.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px] self-center">无分类防伪标签</span>
                          ) : (
                            objTags.map((t, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700/80 border border-blue-200 text-[10.5px] px-2 py-0.5 rounded flex items-center space-x-1 font-mono">
                                <span className="font-bold">{t.key}={t.value}</span>
                                <button
                                  type="button"
                                  onClick={() => setObjTags(objTags.filter((_, tagIdx) => tagIdx !== idx))}
                                  className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
                                >
                                  ✕
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Add line */}
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                          <input
                            type="text"
                            placeholder="标签键"
                            value={inputTagKey}
                            onChange={(e) => setInputTagKey(e.target.value)}
                            className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-1/2 outline-none animate-fadeIn"
                          />
                          <input
                            type="text"
                            placeholder="标签值"
                            value={inputTagVal}
                            onChange={(e) => setInputTagVal(e.target.value)}
                            className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-1/2 outline-none animate-fadeIn"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (inputTagKey && inputTagVal) {
                                if (objTags.some(t => t.key === inputTagKey)) {
                                  alert('已有该标签键！');
                                  return;
                                }
                                setObjTags([...objTags, { key: inputTagKey, value: inputTagVal }]);
                                setInputTagKey('');
                                setInputTagVal('');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded cursor-pointer text-xs"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActionType === 'headers' && (
                      <div className="space-y-3.5 animate-fadeIn font-sans">
                        <span className="font-semibold text-slate-600 block">配置 HTTP 响应头属性：</span>
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="text-slate-450 block font-semibold mb-1 uppercase text-[9px]">Cache-Control (缓存控制)</label>
                            <input
                              type="text"
                              value={inputHeaders['Cache-Control']}
                              onChange={(e) => setInputHeaders({ ...inputHeaders, 'Cache-Control': e.target.value })}
                              placeholder="e.g. max-age=86400"
                              className="bg-white border border-slate-300 px-2.5 py-1.5 rounded w-full outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-450 block font-semibold mb-1 uppercase text-[9px]">Content-Disposition (指明内容格式)</label>
                            <input
                              type="text"
                              value={inputHeaders['Content-Disposition']}
                              onChange={(e) => setInputHeaders({ ...inputHeaders, 'Content-Disposition': e.target.value })}
                              className="bg-white border border-slate-300 px-2.5 py-1.5 rounded w-full outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-450 block font-semibold mb-1 uppercase text-[9px]">Content-Type (互联网媒体格式类型)</label>
                            <input
                              type="text"
                              value={inputHeaders['Content-Type']}
                              onChange={(e) => setInputHeaders({ ...inputHeaders, 'Content-Type': e.target.value })}
                              className="bg-white border border-slate-300 px-2.5 py-1.5 rounded w-full outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-450 block font-semibold mb-1 uppercase text-[9px]">Content-Encoding (压缩编码方法)</label>
                            <input
                              type="text"
                              value={inputHeaders['Content-Encoding']}
                              onChange={(e) => setInputHeaders({ ...inputHeaders, 'Content-Encoding': e.target.value })}
                              placeholder="e.g. gzip"
                              className="bg-white border border-slate-300 px-2.5 py-1.5 rounded w-full outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeActionType === 'symlink' && (
                      <div className="space-y-3 font-sans animate-fadeIn">
                        <span className="font-semibold text-slate-600 block">软链接符号对象名称:</span>
                        <input
                          type="text"
                          value={inputSymlink}
                          onChange={(e) => setInputSymlink(e.target.value)}
                          placeholder="例如 my_short_url.lnk"
                          className="bg-white border border-slate-300 px-3 py-2 rounded w-full outline-none text-xs font-mono"
                        />
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          云端软链接符号文件(Symlink)是一个 0 字节特殊指针，当外部客户端请求此链接路径时，ZOS 将重定向回源头目标对象："<span className="font-mono text-slate-705">{activeActionFile.name}</span>"。
                        </p>
                      </div>
                    )}

                    {activeActionType === 'copy' && (
                      <div className="space-y-3 font-sans animate-fadeIn">
                        <span className="font-semibold text-slate-600 block">新复制副本文件名/路径：</span>
                        <input
                          type="text"
                          value={inputCopyDest}
                          onChange={(e) => setInputCopyDest(e.target.value)}
                          placeholder="e.g. archive_v2.png"
                          className="bg-white border border-slate-300 px-3 py-2 rounded w-full outline-none text-xs font-mono"
                        />
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          目标将被原子化一键备份保存在当前目录：<span className="font-mono text-slate-700">{currentPath || '/'}</span>。
                        </p>
                      </div>
                    )}

                    {activeActionType === 'rename' && (
                      <div className="space-y-3 font-sans animate-fadeIn">
                        <span className="font-semibold text-slate-600 block">修改新文件名:</span>
                        <input
                          type="text"
                          value={inputRename}
                          onChange={(e) => setInputRename(e.target.value)}
                          className="bg-white border border-slate-300 px-3 py-2 rounded w-full outline-none text-xs font-semibold"
                        />
                      </div>
                    )}

                    {activeActionType === 'share' && (
                      <div className="space-y-3.5 font-sans animate-fadeIn">
                        <span className="font-semibold text-slate-600 block">私有签名临时临时提取：</span>
                        <div className="flex items-center space-x-2">
                          <span className="shrink-0 text-slate-450 font-semibold text-[10px] uppercase">选择签名有效期:</span>
                          <select
                            value={inputShareExpiry}
                            onChange={(e) => setInputShareExpiry(Number(e.target.value))}
                            className="border border-slate-300 rounded px-1.5 py-1 text-slate-705 bg-white text-xs outline-none focus:border-blue-500 flex-1"
                          >
                            <option value="60">1 分钟 (极速过期)</option>
                            <option value="3600">1 小时 (高频交互)</option>
                            <option value="86400">24 小时 (临时共享)</option>
                            <option value="604800 text-[11px]">7 天 (长效项目)</option>
                          </select>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded border border-slate-150 font-mono text-[10px] break-all select-all pt-2 text-left">
                          <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wide mb-1">临时访问下载 URL（集成加密 Acl Token）</span>
                          <span className="text-slate-600 break-all leading-tight">
                            https://{bucket.name}.jiangsu-10.zos.ctyun.cn/{activeActionFile.key}?AccessKeyId=LTAI5tH&Expires={Math.round(Date.now() / 1000) + inputShareExpiry}&Signature=bQ9gE%3D
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const url = `https://${bucket.name}.jiangsu-10.zos.ctyun.cn/${activeActionFile.key}?AccessKeyId=LTAI5tH&Expires=${Math.round(Date.now() / 1000) + inputShareExpiry}&Signature=bQ9gE%3D`;
                            navigator.clipboard.writeText(url);
                            triggerToast('📋 已复制临时专属下载共享 URL！');
                          }}
                          className="w-full py-1.5 bg-blue-50 hover:bg-blue-105 border border-blue-200 text-[#0c66e4] font-bold rounded cursor-pointer text-xs"
                        >
                          复制专属共享链接
                        </button>
                      </div>
                    )}

                    {activeActionType === 'class' && (
                      <div className="space-y-4 font-sans animate-fadeIn">
                        <span className="font-semibold text-slate-600 block">选择物理存储池类型:</span>
                        <div className="flex flex-col space-y-2">
                          {([
                            { code: 'STANDARD', title: '标准存储 (Standard S3 Storage)', desc: '适用于高频热数据读取，极致吞吐，毫秒延迟。' },
                            { code: 'IA', title: '低频访问存储 (Infrequent Access)', desc: '适用于低频冷备（一月1次左右），存储单价便宜，但有最小保留天数及取回网络费用。' },
                            { code: 'ARCHIVE', title: '归档冷存储 (Archive Cold Storage)', desc: '适用于合规合备。存储费用无限低。提取取回数据耗时慢，需要提前执行解冻。' },
                          ] as const).map((sc) => (
                            <label key={sc.code} className="flex items-center space-x-2.5 p-2 hover:bg-slate-50 border border-slate-150 rounded cursor-pointer transition-all text-xs">
                              <input
                                type="radio"
                                name="storage-class-choice"
                                checked={inputClass === sc.code}
                                onChange={() => setInputClass(sc.code)}
                                className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800 uppercase text-xs">{sc.title}</span>
                                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">{sc.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end px-5 py-3 bg-slate-50 border-t border-slate-150 rounded-b-lg space-x-2">
                    <button
                      onClick={() => {
                        setActiveActionFile(null);
                        setActiveActionType(null);
                      }}
                      className="px-3.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-65 rounded cursor-pointer text-xs transition-colors h-8"
                    >
                      关闭
                    </button>
                    {activeActionType !== 'share' && (
                      <button
                        onClick={() => {
                          if (activeActionType === 'acl') handleConfirmAcl();
                          else if (activeActionType === 'tags') handleConfirmTags();
                          else if (activeActionType === 'headers') handleConfirmHeaders();
                          else if (activeActionType === 'symlink') handleConfirmSymlink();
                          else if (activeActionType === 'copy') handleConfirmCopy();
                          else if (activeActionType === 'rename') handleConfirmRename();
                          else if (activeActionType === 'class') handleConfirmClass();
                        }}
                        className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer text-xs shadow transition-colors h-8"
                      >
                        确认
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Multipart concurrently concurrent upload task manager */}
            {activeTab === 'multipart' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Code className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">大文件分段并发合并引擎 (ZOS S3 Concurrent Multipart Engine)</h3>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    存储桶分段上传允许上传体积超过 5GB 的超大型文件归档包（如数 TB 的数据库冷备或科研星云扫描映像）。
                    每个分段是一个独立的文件块（Chunk），由 ZOS 多线程高并发异步推入云端，在块全部推入后执行原子级别一键瞬间物理分片合并，任何错误都可发起断点续传。
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-lg max-w-3xl">
                    {multipartStatus === 'idle' ? (
                      <div className="space-y-3">
                        <span className="text-slate-700 block text-xs font-bold">🛠️ 触发生成 48.5GB 超大归档分段模拟上传？</span>
                        <p className="text-[10.5px] text-slate-400">系统将自动把大包预划分为多达 9700 个并发节点（分片大小 5MB），支持中断重续。</p>
                        <button
                          onClick={handleBeginMultipartSimulation}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md transition-all cursor-pointer text-xs flex items-center space-x-1.5 shadow"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>启动高并发分段上传 & 自动极速合并</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 font-mono">
                        <div className="flex items-center justify-between text-xs select-none">
                          <div className="flex items-center space-x-2 text-slate-700 font-bold font-sans">
                            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                            <span>高并发物理片传送中 (Active Chunk Multiplexing)</span>
                          </div>
                          <span className="font-bold">合并进度: {multipartProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full transition-all" style={{ width: `${multipartProgress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-relaxed font-sans mt-1">分段哈希核准校验 (OSD Node Block Verification)...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multipart Task list table */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">存储桶当前分段物理碎片任务链 (Active tasks)</h3>
                  <table className="w-full text-left text-xs border-collapse text-slate-650">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-[10px] border-b border-slate-200 text-slate-500 uppercase">
                        <th className="py-2.5 px-3">任务 ID (UploadId)</th>
                        <th className="py-2.5">文件对象名</th>
                        <th className="py-2.5">分段数 (Parts)</th>
                        <th className="py-2.5">设计总容量</th>
                        <th className="py-2.5">传输进度</th>
                        <th className="py-2.5 text-center">状态</th>
                        <th className="py-2.5 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">mp-task-809dfbce</td>
                        <td className="font-sans text-slate-700 font-semibold">db_idealcloud_cold_backup_2026.zip</td>
                        <td className="text-slate-500">9,700 个分片</td>
                        <td className="text-slate-500">48.5 GB</td>
                        <td className="font-bold text-emerald-600">100% (已物理物理合并)</td>
                        <td className="text-center">
                          <span className="bg-green-50 text-emerald-600 border border-green-200 px-1.5 py-0.5 rounded font-sans font-bold text-[10px]">已入库</span>
                        </td>
                        <td className="text-center select-none">
                          <span className="text-slate-400 font-sans">物理合并完毕</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">mp-task-f9cf10e8</td>
                        <td className="font-sans text-slate-700">highway_surveillance_record.mp4</td>
                        <td className="text-slate-500">2,480 个分片</td>
                        <td className="text-slate-550">12.4 GB</td>
                        <td className="text-blue-600 font-bold">45% 传输中</td>
                        <td className="text-center">
                          <span className="bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-sans font-bold text-[10px]">并发流中</span>
                        </td>
                        <td className="text-center select-none font-sans space-x-2">
                          <button onClick={() => triggerToast('文件分片传输已暂停，保留上传断点')} className="text-xs text-blue-600 hover:underline">暂停</button>
                          <button onClick={() => triggerToast('已彻底物理删除并释放此碎片的暂占容量')} className="text-xs text-red-600 hover:underline">废弃碎片</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Standard visual policy controls and CORS builder details */}
            {activeTab === 'auth' && (
              <div className="space-y-6">
                {/* Visual ACL Setting */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">存储空间读写控制权限 (Bucket ACL)</h3>
                  </div>
                  <p className="text-xs text-slate-500">ACL 是最简单、针对桶整体范围的控制策略。支持私有（仅授权凭据可读写）、公共读（允许公开外网访问直接解析下载，禁止上传写）、公共读写（任何匿名端可覆写，不推荐）。</p>
                  
                  <div className="flex space-x-5 select-none pt-1">
                    {[
                      { id: 'private', title: '私有 (Private)', desc: '仅本空间开通者或拥有明确附加 AWS 策略的用户可执行读取、写入行为，安全极佳' },
                      { id: 'public-read', title: '公共读 (Public Read)', desc: '允许外网任何匿名客户端通过 REST 直链下载对象，但只有管理员能物理写' },
                      { id: 'public-read-write', title: '⚠️ 公共读写 (Public Read Write)', desc: '任何人均可高频覆写、篡改、删除或下载此空间内的资源。极不安全！' },
                    ].map((opt) => (
                      <label key={opt.id} className={`flex-1 p-4 border rounded-lg cursor-pointer flex flex-col justify-between transition-all ${
                        bucket.acl === opt.id 
                          ? 'border-[#fa541c] bg-[#fa541c]/5 shadow-sm' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <input 
                            type="radio" 
                            name="bucket-acl-toggle" 
                            checked={bucket.acl === opt.id} 
                            onChange={() => handleAclToggle(opt.id as any)}
                            className="text-[#fa541c] focus:ring-0"
                          />
                          <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                        </div>
                        <span className="text-[10.5px] text-slate-450 leading-relaxed">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* S3 visual standard Policy configuration code generator box */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">存储桶精细化策略授权策略器 (Bucket Policy Builder)</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      通过图形策略设计生成标准 S3 实体 JSON 白名单 policy。常用于精细跨账号、细分 API 功能权限（如排除特定的 `Delete` 物理抹去动作）等高吞吐场景下。
                    </p>

                    <div className="space-y-3 text-xs text-slate-650">
                      <div>
                        <span className="text-slate-455 block mb-1 font-semibold">1. 检查结果 Effect</span>
                        <div className="flex space-x-4 select-none">
                          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-800 font-medium">
                            <input type="radio" checked={policyEffect === 'Allow'} onChange={() => setPolicyEffect('Allow')} className="text-blue-600" />
                            <span>允许 (Allow)</span>
                          </label>
                          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-800 font-medium">
                            <input type="radio" checked={policyEffect === 'Deny'} onChange={() => setPolicyEffect('Deny')} className="text-blue-600" />
                            <span>显式拒绝 (Deny)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-455 block mb-1 font-semibold">2. 授权关联访问凭据账户 Principal</span>
                        <select value={policyPrincipal} onChange={(e) => setPolicyPrincipal(e.target.value)} className="w-full bg-slate-50 border border-slate-250 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 font-sans">
                          <option value="*">所有注册域以及匿名客户端访问 (*)</option>
                          <option value="ops-admin@idealcloud.com">特定系统运维运维经理 (ops-admin@idealcloud.com)</option>
                          <option value="dev-key-zos@ctyun.cn">测试调试凭据账号 (dev-key-zos@ctyun.cn)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-455 block mb-1 font-semibold">3. 细分动作 API 请求</span>
                        <select value={policyAction} onChange={(e) => setPolicyAction(e.target.value)} className="w-full bg-slate-50 border border-slate-250 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 font-sans font-mono text-xs">
                          <option value="GetObject">读取/解析/查看 ZOS 对象 (zos:GetObject)</option>
                          <option value="PutObject">写入/覆盖/上传 ZOS 对象 (zos:PutObject)</option>
                          <option value="DeleteObject">物理永久抹去 ZOS 对象 (zos:DeleteObject)</option>
                          <option value="*">代表所有 S3 系列 API 支持权限 (zos:*)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-455 block mb-1 font-semibold">4. 资源白名单表达式 Resoirces Pattern</span>
                        <input
                          type="text"
                          value={policyResource}
                          onChange={(e) => setPolicyResource(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full space-y-2.5">
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2 rounded-md">
                      <span className="text-slate-550 font-mono text-[9px] font-bold">ZOS S3 SCHEMA POLICY (.json)</span>
                      <button
                        onClick={() => {
                          triggerToast('JSON 安全策略已成功安全部署落盘！');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 text-[10px] rounded transition-all cursor-pointer"
                      >
                        安全部署策略 (Apply)
                      </button>
                    </div>
                    <textarea
                      value={bucketPolicyJSON}
                      onChange={(e) => setBucketPolicyJSON(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-lg p-3 font-mono text-[10.5px] text-emerald-400 line-height-relaxed min-h-[220px] focus:outline-none"
                      spellCheck="false"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Basic Settings: SSE-KMS, HTTP Referer, WORM, life-cycles, Webhooks, etc. */}
            {activeTab === 'settings' && (
              <div className="space-y-6" id="tab-zos-settings-management">
                {/* 1. SERVER SIDE KMS ENCRYPTION */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">1. KMS 服务端落盘物理自动加密 (SSE-KMS Encryption)</h3>
                  </div>

                  <p className="text-xs text-slate-550 leading-relaxed">
                    启用服务端加密（Server Side Encryption）后，用户或端点上传的对象流，将在底盘 SSD 落盘写操作合并前自动过片硬件级解密完成静态物理加密。
                    当授权客户端发起合法 REST 读操作时，云内核自动拦截流并明文输出给客户端。
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-805 block">落盘自动加密 (SSE KMS Switch)</span>
                      <span className="text-[10px] text-slate-450 block font-normal">托管在云密钥管理控制层 KMS 集群</span>
                    </div>
                    <div className="flex items-center space-x-2 select-none">
                      <button
                        onClick={() => handleToggleSse(false)}
                        className={`px-3 py-1 text-xs rounded font-bold cursor-pointer transition-all ${
                          !bucket.encryption.enabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        关闭
                      </button>
                      <button
                        onClick={() => handleToggleSse(true)}
                        className={`px-3 py-1 text-xs rounded font-bold cursor-pointer transition-all ${
                          bucket.encryption.enabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        开启 KMS 加密
                      </button>
                    </div>
                  </div>

                  {bucket.encryption.enabled && (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-900 font-mono text-[10px] text-emerald-400">
                      <div>🗝️ [KMS-ZOS-KEY]: arn:ctyun:kms:cn-east-1:root:key/key-zos-{bucket.name}-automatic-uuid-09a8cf23</div>
                    </div>
                  )}
                </div>

                {/* 2. HOTLINK PROTECTION (HTTP REFERER) */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">2. HTTP Referer 防盗链规则与沙箱</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-slate-500 font-semibold block mb-1">允许的 Referer 白名单 (支持通配符 `*`，每行一个)</span>
                      <textarea
                        value={refererWhitelistInput}
                        onChange={(e) => setRefererWhitelistInput(e.target.value)}
                        placeholder="例如:\n*.ctyun.cn\n*.idealcloud.com"
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 font-mono text-xs text-slate-800 h-24 focus:outline-none"
                      ></textarea>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block mb-1">强制拒绝的 Referer 黑名单 (优先级最高)</span>
                      <textarea
                        value={refererBlacklistInput}
                        onChange={(e) => setRefererBlacklistInput(e.target.value)}
                        placeholder="例如:\n*.malicious.com\nspammers.org"
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 font-mono text-xs text-slate-805 h-24 focus:outline-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">允许空白的 Referer 请求 (Allow Null)</span>
                      <span className="text-[10.5px] text-slate-450 block font-normal">如果允许，浏览器中直接粘贴或新标签单独打开可以绕开拦截正常。</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={bucket.referer.allowEmpty}
                      onChange={(e) => {
                        const updatedBucket = {
                          ...bucket,
                          referer: { ...bucket.referer, allowEmpty: e.target.checked },
                        };
                        onUpdateBucket(updatedBucket);
                      }}
                      className="rounded border-slate-300 text-blue-600 h-4 w-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveRefererConfig}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-md text-xs cursor-pointer"
                    >
                      保存Referer设置
                    </button>
                  </div>

                  {/* Sandbox checker */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-2">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">在线防盗链拦截模拟校验器 (Hotlink validation Sandbox)</span>
                    <div className="flex bg-white border border-slate-250 rounded overflow-hidden text-xs items-center max-w-2xl">
                      <div className="bg-slate-100 px-2 py-1 text-slate-500 font-mono text-[10px] select-none shrink-0">Test Header:</div>
                      <input
                        type="text"
                        value={testRefererHeader}
                        onChange={(e) => setTestRefererHeader(e.target.value)}
                        placeholder="输入模拟域名, 例如 https://console.ctyun.cn"
                        className="flex-1 px-2.5 text-slate-800 text-xs focus:outline-none py-1.5 font-mono"
                      />
                      <button
                        onClick={handleValidateRefererHeader}
                        className="bg-blue-600 hover:bg-blue-700 hover:text-white px-4 py-1.5 font-bold text-white cursor-pointer text-xs shrink-0"
                      >
                        模拟触发测试
                      </button>
                    </div>

                    {refererTestResult !== 'none' && (
                      <div className="flex items-center space-x-1.5 text-xs select-none pt-1">
                        <span className="font-semibold text-slate-605">校验反馈结果:</span>
                        {refererTestResult === 'allowed' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                            ✔ 拦截器放行: Referer白名单匹配通过
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold">
                            ❌ 拦截器熔断: Referer不匹配, 返回 403 Access Denied
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. WORM RETENTION HOLDS */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <Lock className="h-5 w-5 text-red-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900">3. 合规保留法规锁定 (WORM Legal Holds)</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    锁定政策（WORM - Write Once Read Many）支持法律机构的严格保留指标。一旦桶开启了锁定机制，
                    不论是否具有根用户（Docker Container root / Admin）特权，
                    <span className="text-red-600 font-bold px-1 underline">均无法在有效期未抵达前修改、覆写或删除已被锁定的物理数据</span>
                    ，保证金融流水或医疗病历不被污染。
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-150 flex items-center justify-between font-sans">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">法定期强制锁定保留限制期</span>
                      <span className="text-[10px] text-slate-450 block">对象在此天数内强制处于锁保护，无法删除。</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={wormDaysInput}
                        onChange={(e) => setWormDaysInput(parseInt(e.target.value) || 0)}
                        disabled={bucket.worm.locked}
                        className="w-16 bg-white border border-slate-250 rounded px-2.5 py-1 text-slate-800 text-center font-mono focus:outline-none disabled:opacity-50"
                      />
                      <span className="text-xs text-slate-500 font-bold">天</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center bg-red-50/50 p-3 rounded-lg border border-red-150 text-xs gap-3">
                    {bucket.worm.locked ? (
                      <div className="flex items-center space-x-2 text-red-650 font-bold">
                        <Lock className="h-4 w-4 text-red-600" />
                        <span>「合规机制锁定中」 强制保护已写入 OSD 的全部数据对象！</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                          <Unlock className="h-4 w-4" />
                          <span>法保留状态暂未固化锁定，属于草稿。</span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedBucket = {
                              ...bucket,
                              worm: {
                                ...bucket.worm,
                                enabled: true,
                                locked: true,
                                retentionDays: wormDaysInput,
                                createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
                              },
                            };
                            onUpdateBucket(updatedBucket);
                            alert('⚠️ 核对警告：WORM锁定策略一旦在云端终身固化配置落盘，哪怕是最高云超级管理员、开发团队也无法再次将其反向退回或删除！请确认您的法条和业务需求！');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-md cursor-pointer text-xs shadow-md"
                        >
                          提交并开启终身只读只读合规锁
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. LIFECYCLE RULES */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">4. 生命周期自动下沉及物理清理规则</h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    定义特定规则自动清理，例如：上传 30 天后的销售文档自动转为
                    <span className="text-blue-600 font-bold px-1">低频存储 (IA)</span>
                    降低 40% 的存储费；而超过 180 天后的文档自动下沉转至
                    <span className="text-purple-600 font-bold px-1">冷备归档 (Archive)</span>
                    ，满 365 满一整年后自动云端物理销毁，降低冷数据集长期滞留对项目造成的维护预算负担。
                  </p>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 space-y-4 select-none max-w-4xl">
                    <div className="text-xs font-bold text-slate-800">添加生命周期清洗规则</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">规则名称</span>
                        <input
                          type="text"
                          value={lcName}
                          onChange={(e) => setLcName(e.target.value)}
                          placeholder="例如 report-cleanup-rule"
                          className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">筛选生效范围</span>
                        <select value={lcType} onChange={(e: any) => setLcType(e.target.value)} className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 cursor-pointer">
                          <option value="prefix">根据特定对象键前缀筛选</option>
                          <option value="entire">应用到本存储桶内的全部文件</option>
                        </select>
                      </div>
                      {lcType === 'prefix' && (
                        <div>
                          <span className="text-slate-500 block mb-1">输入前缀 (prefix filter)</span>
                          <input
                            type="text"
                            value={lcPrefix}
                            onChange={(e) => setLcPrefix(e.target.value)}
                            placeholder="例如 data-temp/"
                            className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 focus:outline-none font-mono text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-1 font-mono text-[11px] text-slate-500 border-t border-slate-200">
                      <div>
                        <span className="block mb-1 font-sans">过渡低频 (IA) 天数</span>
                        <div className="flex items-center space-x-1">
                          <input type="number" value={lcIaDays} onChange={(e) => setLcIaDays(parseInt(e.target.value) || 0)} className="bg-white border border-slate-250 rounded px-1.5 py-1 text-center w-16 focus:outline-none" />
                          <span>天后</span>
                        </div>
                      </div>
                      <div>
                        <span className="block mb-1 font-sans">过渡归档 (Archive) 天数</span>
                        <div className="flex items-center space-x-1">
                          <input type="number" value={lcArcDays} onChange={(e) => setLcArcDays(parseInt(e.target.value) || 0)} className="bg-white border border-slate-250 rounded px-1.5 py-1 text-center w-16 focus:outline-none" />
                          <span>天后</span>
                        </div>
                      </div>
                      <div>
                        <span className="block mb-1 font-sans">彻底物理销毁时间</span>
                        <div className="flex items-center space-x-1">
                          <input type="number" value={lcExpDays} onChange={(e) => setLcExpDays(parseInt(e.target.value) || 0)} className="bg-white border border-slate-250 rounded px-1.5 py-1 text-center w-16 focus:outline-none" />
                          <span>天后</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleAddLifecycleRule}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-md text-xs cursor-pointer"
                      >
                        部署此自动化生命周期规则
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                          <th className="py-2.5 px-3">规则名称</th>
                          <th className="py-2.5">作用资源范围</th>
                          <th className="py-2.5">IA 低频转换 (30%削减)</th>
                          <th className="py-2.5">Archive 归档下沉 (60%削减)</th>
                          <th className="py-2.5 text-red-650">物理删除期</th>
                          <th className="py-2.5 text-center">当前状态</th>
                          <th className="py-2.5 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                        {bucket.lifecycleRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-3 font-semibold font-sans text-slate-900">{rule.name}</td>
                            <td className="text-slate-500 font-sans">
                              {rule.filterType === 'entire' ? '应用到整个存储的空间' : `前缀："${rule.prefix}"`}
                            </td>
                            <td className="text-[#f97316]">
                              {rule.currentVersionTransition?.iaDays ? `${rule.currentVersionTransition.iaDays} 天过渡` : '未配置'}
                            </td>
                            <td className="text-blue-650">
                              {rule.currentVersionTransition?.archiveDays ? `${rule.currentVersionTransition.archiveDays} 天过渡` : '未配置'}
                            </td>
                            <td className="text-red-500 font-bold">
                              {rule.currentVersionTransition?.expireDays ? `${rule.currentVersionTransition.expireDays} 天擦除` : '永不删除'}
                            </td>
                            <td className="text-center">
                              <span className="bg-green-50 text-emerald-600 border border-green-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold font-sans">运行生效中</span>
                            </td>
                            <td className="text-center select-none font-sans">
                              <button onClick={() => handleDeleteLifecycleRule(rule.id)} className="text-xs text-red-650 hover:underline">删除</button>
                            </td>
                          </tr>
                        ))}
                        {bucket.lifecycleRules.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-sans select-none">存储桶暂未应用任何自动化成本生命周期策略。</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. DR CRR CROSS REPLICATION AND EVENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
                  {/* CRR */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">5. 跨区域异步同城物理灾备同步 (Cross-Region Replication)</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      云端异步热容灾。当激活容灾链后，您在此存储桶放入的全部对象会在 2ms 内自动、多线程异步同步至另一隔绝的物理节点容器中，确保国家特级物理高灾抗震级系数。
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white select-none">
                        <span className="font-bold text-slate-800">异地冗余通道状态</span>
                        <span className="text-[10px] bg-green-50 text-emerald-600 border border-green-200 px-1.5 rounded font-mono font-bold">双地热连 Active</span>
                      </div>
                      <div className="pt-2 text-[10.5px] text-slate-500 leading-relaxed font-mono">
                        <div>热容灾备份源站：{bucket.name} ({bucket.region})</div>
                        <div className="text-blue-600">热容灾备份靶站：bucket-chengdu-recovery (成都公共资源池-04)</div>
                      </div>
                    </div>
                  </div>

                  {/* Webhook notification events */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                      <Plus className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">6. 对象高敏操作自动事件通知 Webhooks (Automated Trigger)</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      高敏事件自动化分发通知。绑定触发事件如 PUT (上传完成后) 或 DELETE (删除彻底抹去后)，自动向队列或自定义 Webhook POST 信息和报文。
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">最近触发的事件日志通知链:</span>
                      {bucket.eventNotifications.map((ev) => (
                        <div key={ev.id} className="text-[10.5px] font-mono p-2 bg-white rounded border border-slate-150 space-y-1">
                          <div className="flex justify-between font-sans text-xs font-bold text-slate-800">
                            <span>{ev.name}</span>
                            <span className="text-[9px] uppercase bg-blue-50 text-blue-600 border border-blue-150 px-1 rounded">MNS-QUEUE</span>
                          </div>
                          <div className="text-slate-500 font-normal">捕获高敏操作: {ev.events.join(', ')}</div>
                          <div className="truncate text-slate-400 text-[10px]">发往分发网络端点: {ev.targetEndpoint}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Standard Versioning controls and histories */}
            {activeTab === 'versions' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <History className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">存储空间多版本历史管理控制 (Bucket Versioning Control)</h3>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    版本控制是一项极为关键的安全盾牌。开通后，同名对象的二次覆盖上传将绝非“覆灭旧版本数据”，而是将旧版本妥善在后台转换编码赋予唯一的专属版本 UUID (如 `v-e982ad`) 保留，新上传对象作为 Latest 当前主界面展示活动版本，彻底隔离了由病毒劫持加密或恶意覆盖带来的终极大损失。
                  </p>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-150 flex flex-wrap items-center justify-between gap-4 max-w-3xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-850 block">存储桶当前历史多版本配置</span>
                      <span className="text-[10.5px] text-slate-450 block font-normal">由 WORM 与 console 自定，保护期间物理不可逆。</span>
                    </div>

                    <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden font-sans p-1">
                      <button 
                        onClick={() => {
                          setVersioningEnabled(false);
                          triggerToast('历史版本追踪功能暂归沉默');
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                          !versioningEnabled ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        已停用暂停
                      </button>
                      <button 
                        onClick={() => {
                          setVersioningEnabled(true);
                          triggerToast('存储桶历史版本控制安全防御罩完全亮灯！');
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                          versioningEnabled ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        ✔ 已开启多版本控制
                      </button>
                    </div>
                  </div>

                  {versioningEnabled && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs flex items-start space-x-2.5 text-blue-800 max-w-3xl">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">多版本强壮期活跃</span>
                        <span className="text-[11px] leading-relaxed block text-blue-700/90 mt-0.5">
                          为了优化存储扣费余额，已被转换为历史记录的旧文件块依然会计算在存储总体用量中，推荐配合上面的【自动化生命周期规则管理】对历史版本满 30 天以上的对象碎片进行自动下沉归档或物理物理擦除。
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* S3 history versions tracking list */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <div className="border-b border-slate-100 pb-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">当前对象历史版本穿透记录 (Cross-snapshot version list)</h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2.5 px-3">文件对象唯一识别键 Key</th>
                        <th className="py-2.5">历史版本 ID (Version ID)</th>
                        <th className="py-2.5">版本权重/特性</th>
                        <th className="py-2.5 text-right">文件版本容量.kb</th>
                        <th className="py-2.5 text-right pr-4">版本保存修改时间</th>
                        <th className="py-2.5 text-center w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                      {objects.filter(obj => obj.versions.length > 1).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 font-sans">存储中暂未发现存在并存多版本记录的复合文件对象。</td>
                        </tr>
                      ) : (
                        objects.map(obj => {
                          if (obj.versions.length <= 1) return null;
                          return (
                            <React.Fragment key={obj.key}>
                              {obj.versions.map((ver, idx) => (
                                <tr key={ver.versionId} className="hover:bg-slate-50/40">
                                  <td className="py-2.5 px-3 font-sans text-slate-800 font-bold">{idx === 0 ? obj.key : <span className="text-slate-400 pl-4">↳ 同名历史影子版本</span>}</td>
                                  <td className="text-blue-600 font-bold font-mono">{ver.versionId}</td>
                                  <td className="text-slate-505 font-sans">
                                    {ver.isLatest ? <span className="bg-green-50 text-emerald-600 border border-green-200 text-[9px] px-1 font-bold rounded">Latest 主活动(当前可访问)</span> : <span className="text-slate-400">Archived 历史备份</span>}
                                  </td>
                                  <td className="text-right">{(ver.size / 1024).toFixed(1)} KB</td>
                                  <td className="text-right pr-4 font-mono text-slate-500">{ver.lastModified}</td>
                                  <td className="text-center font-sans">
                                    {!ver.isLatest ? (
                                      <button onClick={() => handleRestoreVersion(obj.key, ver.versionId)} className="text-xs text-blue-600 hover:underline">置为此主版本</button>
                                    ) : (
                                      <span className="text-slate-400 text-xs">活动对象</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 7: S3 Access logging detailed analytics lists */}
            {activeTab === 'logging' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <Terminal className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">对象存储 API 请求审计日志管理 (Bucket Access logs)</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    对象访问日志可精准跟踪和记录谁（发出请求的 IP、认证凭据 User-Agent 和 REST Action）对本存储空间中的哪个具体文件对象实施了何等操作。
                    这些产生的详尽明细审计流水将以文本形式，被云端异步、定期打包直接打包存入您制定的备份桶中，以达到国家金融网安监管审计法案的第 121 条合规要素标准。
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-lg max-w-3xl space-y-4 select-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">开通存储网端 API 日志精细审计投融</span>
                        <span className="text-[10.5px] text-slate-450 block font-normal">选择日志归集靶空间，隔离存储。</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={loggingEnabled}
                        onChange={(e) => {
                          setLoggingEnabled(e.target.checked);
                          triggerToast(e.target.checked ? '已开始开通ZOS空间请求事件流审计' : '审计管道已剥离休眠');
                        }}
                        className="rounded border-slate-300 text-blue-600 h-4.5 w-4.5 cursor-pointer"
                      />
                    </div>

                    {loggingEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans animate-fadeIn">
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">选择日志接收归集 Bucket 靶站</span>
                          <select value={loggingBucket} onChange={(e) => setLoggingBucket(e.target.value)} className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 focus:border-blue-550 font-sans">
                            <option value="logs-retention-store">理想归集日志冷备中心 [logs-retention-store]</option>
                            <option value={bucket.name}>把日志写在本 Bucket中 [{bucket.name}]</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">归档存储前缀 logs prefix</span>
                          <input
                            type="text"
                            value={loggingPrefix}
                            onChange={(e) => setLoggingPrefix(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none font-mono text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated log file downloads */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3.5 select-none">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">实时流式安全访问 API 审计日志明细</h3>
                    <button onClick={() => triggerToast('事件明细缓冲刷新成功')} className="text-xs text-blue-600 hover:underline">刷新明细流</button>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2.5 px-3">请求发起时间</th>
                        <th className="py-2.5">请求源主机 IP 节点</th>
                        <th className="py-2.5">请求类型 Action</th>
                        <th className="py-2.5">访问目标对象 (Object Key)</th>
                        <th className="py-2.5 text-center">HTTP 状态码</th>
                        <th className="py-2.5 text-right pr-4">传输吞吐字节</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-705">
                      {loggingEnabled ? (
                        <>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-500">2026-06-01 02:14:55</td>
                            <td className="text-slate-700 font-bold">112.97.24.18 (江苏宿迁/联通)</td>
                            <td><span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[9.5px] px-1 rounded font-bold font-sans">GET (下载文件)</span></td>
                            <td className="text-slate-755 font-sans font-medium">销售账单统计_idealcloud_722.xlsx</td>
                            <td className="text-center font-bold text-emerald-600">200 OK</td>
                            <td className="text-right pr-4">44.5 KB</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-500">2026-06-01 03:05:12</td>
                            <td className="text-slate-700 font-bold">14.23.119.86 (广东广州/电信)</td>
                            <td><span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[9.5px] px-1 rounded font-bold font-sans">GET (下载文件)</span></td>
                            <td className="text-slate-755 font-sans font-medium">idealcloud_background_42.png</td>
                            <td className="text-center font-bold text-emerald-600">200 OK</td>
                            <td className="text-right pr-4">285.4 KB</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-500">2026-06-01 05:44:01</td>
                            <td className="text-slate-700 font-bold">120.36.42.22 (福建厦门/移动)</td>
                            <td><span className="text-blue-600 bg-blue-50 border border-blue-200 text-[9.5px] px-1 rounded font-bold font-sans">PUT (流上传完成)</span></td>
                            <td className="text-slate-755 font-sans font-medium">uploads/db_archive_part02.tar</td>
                            <td className="text-center font-bold text-blue-600">201 Created</td>
                            <td className="text-right pr-4">120 B</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-sans select-none">
                            因审计开关目前处于关闭状态，为了优化内核 CPU 计算带宽占用，流事件已经静默。请点击上方【开通审计】开始跟踪事件。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
