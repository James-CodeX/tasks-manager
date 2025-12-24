import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Initialize S3 client with Supabase credentials
const s3Client = new S3Client({
  region: process.env.REGION || 'ap-southeast-1',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for Supabase S3
});

const BUCKET_NAME = process.env.BUCKET || 'tasks';

export function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPG, JPEG, and WEBP files are allowed' };
  }

  return { valid: true };
}

export async function saveFile(file: File): Promise<string> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const filename = `screenshots/${timestamp}-${randomStr}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  // Return the public URL
  const baseUrl = process.env.ENDPOINT?.replace('/storage/v1/s3', '');
  return `${baseUrl}/object/public/${BUCKET_NAME}/${filename}`;
}

export function getFileUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return path;
}
