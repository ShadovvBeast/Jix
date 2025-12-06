/**
 * Utility functions for room code generation and QR code handling
 */

import QRCode from 'qrcode';

/**
 * Generates a unique room code
 * Format: 6-character alphanumeric code (uppercase)
 * @returns A unique room code string
 */
export function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;
  let code = '';
  
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Encodes a room code into a QR code data URL
 * @param roomCode - The room code to encode
 * @returns Promise resolving to a data URL string for the QR code image
 */
export async function encodeQRCode(roomCode: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(roomCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 2,
    });
    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to encode QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decodes a room code from QR code data
 * Note: This is primarily for server-side validation.
 * Client-side QR scanning will use a camera-based library.
 * @param qrData - The decoded QR code data string
 * @returns The room code extracted from the QR data
 */
export function decodeQRCode(qrData: string): string {
  // QR code data is the room code itself
  // Validate it's a proper room code format (6 alphanumeric characters)
  const roomCodePattern = /^[A-Z0-9]{6}$/;
  
  if (!roomCodePattern.test(qrData)) {
    throw new Error('Invalid room code format in QR data');
  }
  
  return qrData;
}
