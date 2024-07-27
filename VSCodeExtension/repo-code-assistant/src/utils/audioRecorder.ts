import fs from 'fs';
import path from 'path';

import Mic from 'node-mic';

export class AudioRecorder {
  private micInstance: Mic = new Mic({
    rate: 16000,
    channels: 1,
    threshold: 6,
  });
  private micInputStream: any;
  private outputFilePath: string | null = null;
  private writeStream: fs.WriteStream | null = null;

  public async record(outputDir: string): Promise<string> {
    this.micInstance = new Mic({
      rate: 16000,
      channels: 1,
      threshold: 6,
    });

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `audio_${Date.now()}.wav`;
      this.outputFilePath = path.join(outputDir, fileName);
      this.writeStream = fs.createWriteStream(this.outputFilePath);

      this.micInputStream = this.micInstance.getAudioStream();
      this.micInputStream.pipe(this.writeStream);

      this.micInputStream.on('error', (err: any) => {
        console.error('Error in Recording:', err);
        reject(err);
      });

      this.micInputStream.on('silence', () => {
        this.stop().catch((err) => console.error(err));
      });

      this.micInputStream.on('end', () => {
        if (this.outputFilePath) {
          resolve(this.outputFilePath);
        } else {
          reject('No output file path');
        }
      });

      this.micInstance.start();
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.micInstance) {
        this.micInstance.stop();
        resolve();
      } else {
        reject('Mic instance not initialized');
      }
    });
  }
}
