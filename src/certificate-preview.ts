import { createAchievementCertificateCanvas } from './lib/achievementCertificate';

const sample = {
  streakTitle: 'Жақсы Жинақтаушы',
  dailyStreak: 30,
  accuracy: 82,
  testsCompleted: 8,
  flashcardsReviewed: 124,
  totalWeeklyTasks: 21,
};

const canvas = createAchievementCertificateCanvas(sample);
const img = document.getElementById('cert') as HTMLImageElement | null;
const downloadBtn = document.getElementById('download') as HTMLButtonElement | null;

if (!canvas || !img) {
  document.body.innerHTML =
    '<p style="color:white;padding:2rem">Сертификатты жасау мүмкін болмады.</p>';
} else {
  const dataUrl = canvas.toDataURL('image/png');
  img.src = dataUrl;

  downloadBtn?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'bext-certificate-preview.png';
    link.click();
  });
}
