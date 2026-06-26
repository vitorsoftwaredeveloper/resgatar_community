import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  RECEIPTS_PREFIX,
  UPLOAD_URL_EXPIRES_IN,
  VIEW_URL_EXPIRES_IN,
  CONTENT_TYPE_EXTENSION,
  ALLOWED_RECEIPT_CONTENT_TYPES,
  ReceiptContentType,
} from "../constants/s3";

const createS3Client = (): S3Client => {
  console.log("IN - createS3Client");

  const s3Client = new S3Client({
    region: process.env.REGION,
  });

  console.log("OUT - createS3Client");
  return s3Client;
};

const getBucketName = (): string => {
  const bucket = process.env.RECEIPTS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("RECEIPTS_BUCKET_NAME environment variable is not set");
  }
  return bucket;
};

const isAllowedReceiptContentType = (
  contentType: string
): contentType is ReceiptContentType =>
  (ALLOWED_RECEIPT_CONTENT_TYPES as readonly string[]).includes(contentType);

/**
 * Garante que a key pertence ao admin (prefixo receipts/<adminId>/),
 * evitando referenciar recibos de outros admins.
 */
const isReceiptOwnedByAdmin = (key: string, adminId: string): boolean =>
  key.startsWith(`${RECEIPTS_PREFIX}/${adminId}/`);

/**
 * Monta a key (caminho) do recibo dentro do bucket.
 * Ex.: receipts/<adminId>/<uuid>.jpg
 */
const buildReceiptKey = (
  adminId: string,
  contentType: ReceiptContentType
): string => {
  const extension = CONTENT_TYPE_EXTENSION[contentType];
  return `${RECEIPTS_PREFIX}/${adminId}/${randomUUID()}.${extension}`;
};

interface IGenerateUploadUrl {
  uploadUrl: string;
  key: string;
}

/**
 * Gera uma URL pré-assinada (PUT) para o app enviar o recibo direto ao S3.
 * Retorna também a key, que deve ser persistida na Expense.
 */
const generateReceiptUploadUrl = async (
  adminId: string,
  contentType: ReceiptContentType
): Promise<IGenerateUploadUrl> => {
  console.log("IN - generateReceiptUploadUrl");

  const s3 = createS3Client();
  const key = buildReceiptKey(adminId, contentType);

  try {
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: UPLOAD_URL_EXPIRES_IN,
    });

    console.log("OUT - generateReceiptUploadUrl");
    return { uploadUrl, key };
  } catch (error) {
    console.error("Error generating receipt upload URL:", error);
    throw error;
  }
};

/**
 * Gera uma URL pré-assinada (GET) temporária para visualizar o recibo.
 */
const generateReceiptViewUrl = async (key: string): Promise<string> => {
  console.log("IN - generateReceiptViewUrl");

  const s3 = createS3Client();

  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    const viewUrl = await getSignedUrl(s3, command, {
      expiresIn: VIEW_URL_EXPIRES_IN,
    });

    console.log("OUT - generateReceiptViewUrl");
    return viewUrl;
  } catch (error) {
    console.error("Error generating receipt view URL:", error);
    throw error;
  }
};

/**
 * Remove o recibo do S3 (ex.: ao deletar/editar uma Expense).
 */
const deleteReceipt = async (key: string): Promise<void> => {
  console.log("IN - deleteReceipt");

  const s3 = createS3Client();

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })
    );
  } catch (error) {
    console.error("Error deleting receipt:", error);
    throw error;
  }

  console.log("OUT - deleteReceipt");
};

export {
  buildReceiptKey,
  generateReceiptUploadUrl,
  generateReceiptViewUrl,
  deleteReceipt,
  isAllowedReceiptContentType,
  isReceiptOwnedByAdmin,
};
