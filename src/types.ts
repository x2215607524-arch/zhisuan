export type StorageClass = 'STANDARD' | 'IA' | 'ARCHIVE'; // 标准存储、低频访问存储、归档存储
export type RedundancyStrategy = 'SINGLE_AZ' | 'MULTI_AZ'; // 单AZ、多AZ
export type AclType = 'private' | 'public-read' | 'public-read-write'; // 私有、公共读、公共读写

export interface AccessKey {
  accessKeyId: string;
  secretAccessKey: string;
  status: 'active' | 'inactive';
  createTime: string;
}

export interface BucketReferer {
  enabled: boolean;
  allowEmpty: boolean;
  whitelist: string[]; // 换行符隔开的域名
  blacklist: string[];
}

export interface BucketEncryption {
  enabled: boolean;
  type: 'SSE-KMS' | 'SSE-Customer';
  kmsKeyId?: string;
}

export interface BucketWorm {
  enabled: boolean;
  retentionDays: number;
  locked: boolean;
  createTime?: string;
}

export interface LifecycleRule {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
  filterType: 'prefix' | 'entire';
  prefix?: string;
  tags?: { key: string; value: string }[];
  currentVersionTransition?: {
    iaDays?: number;
    archiveDays?: number;
    expireDays?: number;
  };
  previousVersionTransition?: {
    iaDays?: number;
    archiveDays?: number;
    expireDays?: number;
  };
  expiredFolderClean?: boolean;
}

export interface CrossRegionReplication {
  enabled: boolean;
  rules: {
    id: string;
    sourcePrefix?: string;
    destinationRegion: string;
    destinationBucket: string;
    syncHistory: boolean;
    strategy: 'AddModify' | 'Full'; // 增/改 或 增/删/改
  }[];
}

export interface BucketEventNotification {
  id: string;
  name: string;
  events: ('PutObject' | 'PostObject' | 'DeleteObject' | 'RestoreObject')[];
  filterPrefix?: string;
  filterSuffix?: string;
  targetType: 'mns' | 'sms' | 'webhook';
  targetEndpoint: string;
}

export interface BucketInventoryRule {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
  destBucket: string;
  prefix?: string;
  frequency: 'daily' | 'weekly';
  includedFields: ('Size' | 'LastModified' | 'StorageClass' | 'ETag' | 'MultipartUpload')[];
}

export interface ObjectVersion {
  versionId: string;
  isLatest: boolean;
  size: number;
  lastModified: string;
  storageClass: StorageClass;
  isDeleteMarker?: boolean;
}

export interface ObjectItem {
  key: string; // e.g. "docs/manual.pdf"
  name: string; // "manual.pdf"
  folder: string; // "docs/" or ""
  size: number;
  lastModified: string;
  storageClass: StorageClass;
  ownerId: string;
  etag: string;
  contentType: string;
  acl: AclType | 'default';
  tags: { key: string; value: string }[];
  versions: ObjectVersion[];
  isFrozen?: boolean; // For ARCHIVE storage
  restoreExpiryTime?: string; // Until when is it thawed
  restoreStatus?: 'none' | 'restoring' | 'restored';
}

export interface BucketItem {
  name: string;
  region: string; // e.g. "华东-上海36"
  storageClass: StorageClass;
  redundancy: RedundancyStrategy;
  acl: AclType;
  enterpriseProject: string; // 如 "default"
  createTime: string;
  quotaCapacity?: number; // GB, undefined means unlimited
  quotaObjects?: number; // count, undefined means unlimited
  encryption: BucketEncryption;
  referer: BucketReferer;
  worm: BucketWorm;
  lifecycleRules: LifecycleRule[];
  replication: CrossRegionReplication;
  eventNotifications: BucketEventNotification[];
  inventories: BucketInventoryRule[];
}

export interface ResourcePackage {
  id: string;
  type: 'storage' | 'traffic' | 'requests' | 'retrieval';
  name: string;
  region: string;
  storageClass?: StorageClass;
  spec: string; // e.g., "500 GB"
  capacity: number; // in GB or millions
  used: number;
  createTime: string;
  expireTime: string;
  status: 'active' | 'expired';
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface BucketMonitorMetrics {
  storageSizePoints: MetricPoint[]; // Byte
  objectCountPoints: MetricPoint[];
  getRequests: MetricPoint[];
  putRequests: MetricPoint[];
  networkInPoints: MetricPoint[]; // Bytes
  networkOutPoints: MetricPoint[]; // Bytes
}
