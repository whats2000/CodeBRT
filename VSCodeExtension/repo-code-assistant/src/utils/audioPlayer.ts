import { spawn, exec } from 'child_process';
import type { ChildProcess, ExecException } from 'child_process';

/* MAC PLAY COMMAND */
const macPlayCommand = (path: string, volume: number): string =>
  `afplay \"${path}\" -v ${volume}`;

/* WINDOW PLAY COMMANDS */
const addPresentationCore = `Add-Type -AssemblyName presentationCore;`;
const createMediaPlayer = `$player = New-Object system.windows.media.mediaplayer;`;
const loadAudioFile = (path: string): string => `$player.open('${path}');`;
const playAudio = `$player.Play();`;
const stopAudio = `Start-Sleep 1; Start-Sleep -s $player.NaturalDuration.TimeSpan.TotalSeconds;Exit;`;

const windowPlayCommand = (path: string, volume: number): string =>
  `powershell -c ${addPresentationCore} ${createMediaPlayer} ${loadAudioFile(
    path,
  )} $player.Volume = ${volume}; ${playAudio} ${stopAudio}`;

class SoundPlay {
  private playProcess: ChildProcess | null = null;

  async play(path: string, volume = 0.5): Promise<void> {
    const volumeAdjustedByOS =
      process.platform === 'darwin' ? Math.min(2, volume * 2) : volume;

    const playCommand =
      process.platform === 'darwin'
        ? macPlayCommand(path, volumeAdjustedByOS)
        : windowPlayCommand(path, volumeAdjustedByOS);

    try {
      this.playProcess = exec(
        playCommand,
        { windowsHide: true },
        (err: ExecException | null) => {
          if (err) {
            throw err;
          }
        },
      );

      if (this.playProcess) {
        await new Promise<void>((resolve, reject) => {
          this.playProcess?.on('exit', resolve);
          this.playProcess?.on('error', reject);
        });
      }
    } catch (err) {
      throw err;
    }
  }

  stop(): void {
    if (this.playProcess) {
      if (process.platform === 'darwin') {
        this.playProcess.kill('SIGKILL');
      } else if (process.platform === 'win32' && this.playProcess.pid) {
        spawn('taskkill', [
          '/pid',
          this.playProcess.pid.toString(),
          '/f',
          '/t',
        ]);
      }
      this.playProcess = null;
    }
  }
}

export default SoundPlay;
