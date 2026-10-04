const base = import.meta.env.BASE_URL;
export const posterSceneAssets = ['campus', 'study', 'community'].map(
  (name) => `${base}assets/poster-scenes/${name}-v1.webp`,
);
posterSceneAssets.push(`${base}assets/poster-scenes/mentor-placeholder.svg`);
export function packImage(scene: string) {
  if (scene === 'portrait') return posterSceneAssets[3];
  return posterSceneAssets[
    ['library', 'study', 'academic'].includes(scene)
      ? 1
      : ['international', 'community', 'wellbeing', 'portrait'].includes(scene)
        ? 2
        : 0
  ];
}
