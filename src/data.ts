import { BucketItem, ObjectItem, ResourcePackage } from './types';

export const REGIONS = [
  { name: '长沙-公共资源池', code: 'changsha42', endpoint: 'https://changsha42.zos.ctyun.cn' },
  { name: '华东-上海36', code: 'shanghai36', endpoint: 'https://shanghai36.zos.ctyun.cn' },
  { name: '广东-广州6', code: 'guangzhou6', endpoint: 'https://guangzhou6.zos.ctyun.cn' },
  { name: '西南-成都4', code: 'chengdu4', endpoint: 'https://chengdu4.zos.ctyun.cn' },
  { name: '安徽-合肥2', code: 'hefei2', endpoint: 'https://hefei2.zos.ctyun.cn' },
];

export const INITIAL_RESOURCE_PACKAGES: ResourcePackage[] = [
  {
    id: 'pkg-001',
    type: 'storage',
    name: '多AZ标准存储包 (40GB)',
    region: '华东-上海36',
    storageClass: 'STANDARD',
    spec: '40 GB 起订',
    capacity: 40,
    used: 12.4,
    createTime: '2026-01-10 10:00:00',
    expireTime: '2027-01-10 23:59:59',
    status: 'active',
  },
  {
    id: 'pkg-002',
    type: 'traffic',
    name: '公网流出流量包 (50GB)',
    region: '长沙-公共资源池',
    spec: '50 GB 起订',
    capacity: 50,
    used: 4.82,
    createTime: '2026-02-15 14:30:00',
    expireTime: '2026-08-15 23:59:59',
    status: 'active',
  },
  {
    id: 'pkg-003',
    type: 'requests',
    name: '万次 API 请求包',
    region: '广东-广州6',
    spec: '1 万次起订',
    capacity: 10000,
    used: 2750,
    createTime: '2026-03-01 09:15:00',
    expireTime: '2026-09-01 23:59:59',
    status: 'active',
  },
];

// Helper to generate a realistic ETag
const makeETag = () => Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);

export const INITIAL_BUCKETS: BucketItem[] = [
  {
    name: 'bucket-ideal-docs',
    region: '华东-上海36',
    storageClass: 'STANDARD',
    redundancy: 'MULTI_AZ',
    acl: 'private',
    enterpriseProject: 'default',
    createTime: '2025-11-23 08:30:15',
    quotaCapacity: 100, // GB
    quotaObjects: 5000,
    encryption: {
      enabled: true,
      type: 'SSE-KMS',
      kmsKeyId: 'kms-f3daba-29e8-4228-b99b-43ad39b5',
    },
    referer: {
      enabled: true,
      allowEmpty: true,
      whitelist: ['*.idealcloud.com', 'console.ctyun.cn'],
      blacklist: ['spammer.com'],
    },
    worm: {
      enabled: false,
      retentionDays: 30,
      locked: false,
    },
    lifecycleRules: [
      {
        id: 'lc-001',
        name: '自动归档不常用文档',
        status: 'enabled',
        filterType: 'prefix',
        prefix: 'archives/',
        currentVersionTransition: {
          iaDays: 30,
          archiveDays: 90,
        },
      },
    ],
    replication: {
      enabled: true,
      rules: [
        {
          id: 'rep-001',
          sourcePrefix: 'backups/',
          destinationRegion: '西南-成都4',
          destinationBucket: 'bucket-chengdu-dr',
          syncHistory: true,
          strategy: 'AddModify',
        },
      ],
    },
    eventNotifications: [
      {
        id: 'ev-001',
        name: '上传新大文件时告警通知',
        events: ['PutObject', 'PostObject'],
        filterPrefix: 'videos/',
        targetType: 'mns',
        targetEndpoint: '理想消息中心队列_ ideal-queue-1',
      },
    ],
    inventories: [
      {
        id: 'inv-001',
        name: '每月度存储清单规则',
        status: 'enabled',
        destBucket: 'bucket-ideal-docs',
        prefix: 'reports/',
        frequency: 'weekly',
        includedFields: ['Size', 'LastModified', 'StorageClass', 'ETag'],
      },
    ],
  },
  {
    name: 'bucket-video-surveillance',
    region: '长沙-公共资源池',
    storageClass: 'IA',
    redundancy: 'SINGLE_AZ',
    acl: 'public-read',
    enterpriseProject: 'project-traffic',
    createTime: '2025-12-15 16:45:10',
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
      retentionDays: 90,
      locked: false,
    },
    lifecycleRules: [
      {
        id: 'lc-002',
        name: '过期的监控碎片清理',
        status: 'enabled',
        filterType: 'entire',
        expiredFolderClean: true,
        currentVersionTransition: {
          expireDays: 180,
        },
      },
    ],
    replication: {
      enabled: false,
      rules: [],
    },
    eventNotifications: [],
    inventories: [],
  },
  {
    name: 'bucket-medical-archives',
    region: '西南-成都4',
    storageClass: 'ARCHIVE',
    redundancy: 'SINGLE_AZ',
    acl: 'private',
    enterpriseProject: 'project-health',
    createTime: '2026-01-05 09:12:44',
    encryption: {
      enabled: true,
      type: 'SSE-Customer',
    },
    referer: {
      enabled: true,
      allowEmpty: false,
      whitelist: ['medical-system.org', '*.ctyun.cn'],
      blacklist: [],
    },
    worm: {
      enabled: true,
      retentionDays: 365,
      locked: true,
      createTime: '2026-01-05 09:13:00',
    },
    lifecycleRules: [],
    replication: {
      enabled: false,
      rules: [],
    },
    eventNotifications: [],
    inventories: [],
  },
];

export const INITIAL_OBJECTS: { [bucketName: string]: ObjectItem[] } = {
  'bucket-ideal-docs': [
    {
      key: '品牌LOGO.png',
      name: '品牌LOGO.png',
      folder: '',
      size: 15247, // 14.89 KB
      lastModified: '2026-06-01 15:45:21',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'image/png',
      acl: 'default',
      tags: [{ key: 'category', value: 'logo' }],
      versions: [
        {
          versionId: 'v-1005',
          isLatest: true,
          size: 15247,
          lastModified: '2026-06-01 15:45:21',
          storageClass: 'STANDARD',
        }
      ]
    },
    {
      key: '产品使用指南.pdf',
      name: '产品使用指南.pdf',
      folder: '',
      size: 144890, // ~144.89 KB
      lastModified: '2026-03-19 10:14:17',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'application/pdf',
      acl: 'default',
      tags: [{ key: 'docType', value: 'manual' }],
      versions: [
        {
          versionId: 'v-1002',
          isLatest: true,
          size: 144890,
          lastModified: '2026-03-19 10:14:17',
          storageClass: 'STANDARD',
        },
        {
          versionId: 'v-1001',
          isLatest: false,
          size: 121040,
          lastModified: '2026-01-10 11:22:04',
          storageClass: 'STANDARD',
        },
      ],
    },
    {
      key: 'docs/服务开通与资源包管理.jpg',
      name: '服务开通与资源包管理.jpg',
      folder: 'docs/',
      size: 158770, // ~158.77 KB
      lastModified: '2026-03-19 10:15:10',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'image/jpeg',
      acl: 'default',
      tags: [{ key: 'category', value: 'tutorial' }],
      versions: [
        {
          versionId: 'v-2001',
          isLatest: true,
          size: 158770,
          lastModified: '2026-03-19 10:15:10',
          storageClass: 'STANDARD',
        },
      ],
    },
    {
      key: 'docs/生命周期管理.jpg',
      name: '生命周期管理.jpg',
      folder: 'docs/',
      size: 149170, // ~149.17 KB
      lastModified: '2026-03-19 10:14:17',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'image/jpeg',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'v-3001',
          isLatest: true,
          size: 149170,
          lastModified: '2026-03-19 10:14:17',
          storageClass: 'STANDARD',
        },
      ],
    },
    {
      key: 'demo/tokyo_sunset.jpg',
      name: 'tokyo_sunset.jpg',
      folder: 'demo/',
      size: 320500, // ~320.5 KB
      lastModified: '2026-03-15 15:20:00',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'image/jpeg',
      acl: 'public-read',
      tags: [{ key: 'demo', value: 'image-pipeline' }],
      versions: [
        {
          versionId: 'v-4001',
          isLatest: true,
          size: 320500,
          lastModified: '2026-03-15 15:20:00',
          storageClass: 'STANDARD',
        },
      ],
    },
    {
      key: 'demo/idealcloud_logo.png',
      name: 'idealcloud_logo.png',
      folder: 'demo/',
      size: 85000,
      lastModified: '2026-01-20 18:00:20',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'image/png',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'v-5001',
          isLatest: true,
          size: 85000,
          lastModified: '2026-01-20 18:00:20',
          storageClass: 'STANDARD',
        },
      ],
    },
    {
      key: 'reports/inventory_2026_q1.csv',
      name: 'inventory_2026_q1.csv',
      folder: 'reports/',
      size: 44020,
      lastModified: '2026-03-01 00:00:00',
      storageClass: 'STANDARD',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'text/csv',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'v-6001',
          isLatest: true,
          size: 44020,
          lastModified: '2026-03-01 00:00:00',
          storageClass: 'STANDARD',
        },
      ],
    },
  ],
  'bucket-video-surveillance': [
    {
      key: 'shanghai_traffic_high.mp4',
      name: 'shanghai_traffic_high.mp4',
      folder: '',
      size: 450000000, // ~450 MB
      lastModified: '2026-02-12 11:34:00',
      storageClass: 'IA',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'video/mp4',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'v-9001',
          isLatest: true,
          size: 450000000,
          lastModified: '2026-02-12 11:34:00',
          storageClass: 'IA',
        },
      ],
    },
    {
      key: 'beijing_intersection_cam2.mp4',
      name: 'beijing_intersection_cam2.mp4',
      folder: '',
      size: 850000000, // ~850 MB
      lastModified: '2026-02-14 15:10:20',
      storageClass: 'IA',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'video/mp4',
      acl: 'default',
      tags: [],
      versions: [
        {
          versionId: 'v-9101',
          isLatest: true,
          size: 850000000,
          lastModified: '2026-02-14 15:10:20',
          storageClass: 'IA',
        },
      ],
    },
  ],
  'bucket-medical-archives': [
    {
      key: 'patient-f02a-dicom.zip',
      name: 'patient-f02a-dicom.zip',
      folder: '',
      size: 154000000, // ~154 MB
      lastModified: '2026-01-05 10:22:00',
      storageClass: 'ARCHIVE',
      ownerId: 'owner-理想12',
      etag: makeETag(),
      contentType: 'application/zip',
      acl: 'default',
      tags: [{ key: 'confidential', value: 'level-3' }],
      versions: [
        {
          versionId: 'v-7001',
          isLatest: true,
          size: 154000000,
          lastModified: '2026-01-05 10:22:00',
          storageClass: 'ARCHIVE',
        },
      ],
    },
  ],
};

// Generate metric history points for dashboard
export const generateHistoryMetrics = (baseValue: number, fluctuation: number, points = 24): { time: string; value: number }[] => {
  const arr = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const label = `${d.getHours().toString().padStart(2, '0')}:00`;
    const rand = baseValue + (Math.random() - 0.5) * fluctuation;
    arr.push({
      time: label,
      value: Math.max(0, Math.round(rand)),
    });
  }
  return arr;
};

// Map of preconfigured metrics for buckets
export const BUCKET_MONITOR_PRESETS: { [bucketName: string]: any } = {
  'bucket-ideal-docs': {
    storageSizePoints: generateHistoryMetrics(914, 50), // KB
    objectCountPoints: generateHistoryMetrics(6, 0),
    getRequests: generateHistoryMetrics(292, 100),
    putRequests: generateHistoryMetrics(1, 2),
    networkInPoints: generateHistoryMetrics(12044, 4000), // B
    networkOutPoints: generateHistoryMetrics(78440, 20000), // B
  },
  'bucket-video-surveillance': {
    storageSizePoints: generateHistoryMetrics(1300000, 200000), // KB
    objectCountPoints: generateHistoryMetrics(2, 0),
    getRequests: generateHistoryMetrics(30, 20),
    putRequests: generateHistoryMetrics(8, 4),
    networkInPoints: generateHistoryMetrics(450000000, 150000000),
    networkOutPoints: generateHistoryMetrics(25000000, 15000000),
  },
  'bucket-medical-archives': {
    storageSizePoints: generateHistoryMetrics(154000, 0),
    objectCountPoints: generateHistoryMetrics(1, 0),
    getRequests: generateHistoryMetrics(0, 0),
    putRequests: generateHistoryMetrics(0, 0),
    networkInPoints: generateHistoryMetrics(0, 0),
    networkOutPoints: generateHistoryMetrics(0, 0),
  },
};
