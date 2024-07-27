import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import terminate from 'terminate';

/* MAC PLAY COMMAND */
const macPlayCommand = (path: string, volume: number): string =>
  `afplay \"${path}\" -v ${volume}`;

/* WINDOW PLAY COMMANDS */
const addPresentationCore = `Add-Type -AssemblyName PresentationCore;`;
const createMediaPlayer = `$player = New-Object System.Windows.Media.MediaPlayer;`;
const loadAudioFile = (path: string): string => `$player.open('${path}');`;
const waitForDuration = `do { $milliseconds = $player.NaturalDuration.TimeSpan.TotalMilliseconds;} until ($milliseconds);`;
const playAudio = `$player.Play();`;
const stopAudio = `Start-Sleep -Milliseconds $milliseconds; $player.Stop(); $player.Close();exit;`;

const windowPlayCommand = (path: string, volume: number): string =>
  `powershell -c "${addPresentationCore} ${createMediaPlayer} ${loadAudioFile(
    path,
  )} $player.Volume = ${volume}; ${waitForDuration} ${playAudio} ${stopAudio}"`;

export class SoundPlay {
  private playProcess: ChildProcess | null = null;

  public async play(path: string, volume = 0.5): Promise<void> {
    const volumeAdjustedByOS =
      process.platform === 'darwin' ? Math.min(2, volume * 2) : volume;

    const playCommand =
      process.platform === 'darwin'
        ? macPlayCommand(path, volumeAdjustedByOS)
        : windowPlayCommand(path, volumeAdjustedByOS);

    try {
      this.playProcess = spawn(playCommand, {
        shell: true,
        windowsHide: true,
      });

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

  public stop(): void {
    if (this.playProcess?.pid) {
      terminate(this.playProcess.pid, (err) => {
        if (err) {
          throw err;
        }
      });
      this.playProcess = null;
    }
  }
}

export default SoundPlay;
