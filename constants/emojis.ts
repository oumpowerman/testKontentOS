export const EMOJI_POOL = [
  '👾', '🤖', '🦊', '🐯', '🦁', '🐸', '🐵', '🐔', '🐧', '🦉',
  '🦄', '🐝', '🐙', '🐠', '🐼', '🐨', '🦖', '🦕', '🐲', '👻',
  '🧙', '🧚', '💀', '👽', '🤠', '🤡', '🐱', '🐶', '🐹', '🐰',
  '🚀', '🛸', '🍉', '🍕', '🍟', '🍩', '🥑', '🌮', '🎈', '🎉',
  '🎮', '🕹️', '⚔️', '🛡️', '👑', '⭐️', '🌟', '🧩', '🎨', '🔥'
];

export const DEFAULT_EMOJI = '👾';

export const getDeterministicEmoji = (userId: string): string => {
  if (!userId) return DEFAULT_EMOJI;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % EMOJI_POOL.length;
  return EMOJI_POOL[idx];
};
