import { NextRequest, NextResponse } from 'next/server';
import { validateImageFile, uploadFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadFile(buffer, file.name, file.type);
      uploaded.push(result);
    }

    return NextResponse.json({ success: true, files: uploaded });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files. Please try again.' },
      { status: 500 }
    );
  }
}
