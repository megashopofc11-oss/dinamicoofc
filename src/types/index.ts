/**
 * DINÂMICO PRO - Type Definitions
 */

export type UserRole = 'admin' | 'buyer';
export type UserStatus = 'pending' | 'active' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
  phone?: string;
  businessName?: string;
}

export interface ModelCalibration {
  id: number;
  name: string;
  category: string;
  description: string;
  originalUrl: string;
  customBaseUrl?: string; // Optional custom clean image uploaded by admin
  
  // Normalized coordinates (0 to 1 relative to artwork dimensions)
  qrX: number;
  qrY: number;
  qrWidth: number;
  qrHeight: number;
  qrBorderRadius: number; // in pixels at reference resolution
  qrPadding: number;
  qrDarkColor: string;
  qrLightColor: string;
  qrErrorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  
  // Clean mask settings to conceal placeholder/old illustrative QR code seamlessly
  maskEnabled: boolean;
  maskFillColor: string; // Background patch color (e.g. #0d0d0f or gradient)
  maskBorderRadius: number;
  
  // Numbering settings
  numberX: number;
  numberY: number;
  numberFontSize: number; // in pixels at reference resolution (1181x1181)
  numberColor: string;
  numberFontFamily: string;
  numberAlignment: 'left' | 'center' | 'right';
  numberPrefix?: string;
  showNumberBg?: boolean;
  numberBgColor?: string;
  
  // Quality & status
  status: 'calibrated' | 'needs_review' | 'ready';
  lastUpdated?: number;
}

export interface Plaque {
  id: string; // Unique permanent ID (e.g., 'dpro-a8f10b...')
  sequenceNumber: number; // Unique global sequential integer, e.g. 1
  formattedNumber: string; // e.g. '000001'
  batchId: string;
  userId: string;
  modelId: number;
  destinationUrl: string; // Editable destination URL
  permanentUrl: string; // Permanent dynamic QR URL (e.g., 'https://site.com/r/dpro-a8f10b...')
  createdAt: number;
  updatedAt: number;
  scanCount?: number;
  lastScannedAt?: number;
  notes?: string;
}

export interface Batch {
  id: string;
  name: string;
  userId: string;
  userEmail: string;
  modelId: number;
  modelName: string;
  quantity: number;
  startSequenceNumber: number;
  endSequenceNumber: number;
  createdAt: number;
  defaultDestinationUrl?: string;
  tags?: string[];
}

export interface GlobalCounter {
  lastSequenceNumber: number;
  totalBatchesCreated: number;
  totalPlaquesCreated: number;
  totalScansRecorded: number;
}

export interface SystemStats {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalBatches: number;
  totalPlaques: number;
  totalScans: number;
}

export interface RenderOptions {
  width?: number; // default 1181 px (10cm @ 300 DPI)
  height?: number; // default 1181 px
  renderWatermark?: boolean;
}
