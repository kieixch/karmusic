import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = join(root, "public", "demo");
mkdirSync(demoDir, { recursive: true });

const sampleRate = 22050;
const duration = 24;
const totalSamples = sampleRate * duration;
const samples = new Int16Array(totalSamples);

// An original, synthesized ambient progression: Am - F - C - G.
const chords = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [261.63, 329.63, 392.0],
  [196.0, 246.94, 293.66],
];

function envelope(t, chordStart) {
  const local = t - chordStart;
  const attack = Math.min(1, local / 1.2);
  const release = Math.min(1, (6 - local) / 1.6);
  return Math.max(0, Math.min(attack, release));
}

for (let i = 0; i < totalSamples; i += 1) {
  const t = i / sampleRate;
  const chordIndex = Math.min(3, Math.floor(t / 6));
  const chordStart = chordIndex * 6;
  const env = envelope(t, chordStart);
  const fade = Math.min(1, t / 1.5) * Math.min(1, (duration - t) / 2.5);
  let value = 0;

  for (const frequency of chords[chordIndex]) {
    value += Math.sin(2 * Math.PI * frequency * t) * 0.16;
    value += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.035;
    value += Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.05;
  }

  const arpeggioStep = Math.floor(t * 2) % 3;
  const arpeggioFrequency = chords[chordIndex][arpeggioStep] * 2;
  const beat = t % 0.5;
  const pluck = Math.exp(-beat * 9) * 0.08;
  value += Math.sin(2 * Math.PI * arpeggioFrequency * t) * pluck;

  const lfo = 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.08 * t);
  const sample = Math.max(-1, Math.min(1, value * env * fade * lfo));
  samples[i] = Math.round(sample * 32767);
}

const dataBytes = Buffer.alloc(samples.length * 2);
for (let i = 0; i < samples.length; i += 1) {
  dataBytes.writeInt16LE(samples[i], i * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0, "ascii");
header.writeUInt32LE(36 + dataBytes.length, 4);
header.write("WAVE", 8, "ascii");
header.write("fmt ", 12, "ascii");
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36, "ascii");
header.writeUInt32LE(dataBytes.length, 40);

writeFileSync(join(demoDir, "karmusic-demo.wav"), Buffer.concat([header, dataBytes]));

const lrc = `[ar:KarMusic]
[ti:Landscape Signals]
[al:Original demo]
[by:KarMusic]

[00:00.50]The screen turns sideways and the room goes quiet
[00:04.00]Every word is waiting for its moment
[00:08.00]Follow the line, let the chorus find you
[00:12.00]A little light between the verses
[00:16.00]Hold the note until the morning
[00:20.00]Then start the whole song over again
[00:23.00]
`;

writeFileSync(join(demoDir, "karmusic-demo.lrc"), lrc);
writeFileSync(
  join(demoDir, "sample.lrc"),
  `[ti:Your song]
[ar:Your artist]

[00:00.00]Paste your own lyrics here
[00:04.00]Add timestamps like [00:04.00] for synced LRC
[00:08.00]or delete all timestamps for plain lyrics
`,
);

console.log("Generated karmusic-demo.wav, karmusic-demo.lrc and sample.lrc");
