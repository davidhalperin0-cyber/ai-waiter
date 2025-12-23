/**
 * MenuStyle System - Visual Redesign
 * Controls menu content styling independently from background themes.
 */

export type MenuStyleVariant = 'elegant' | 'compact' | 'bold';

export interface MenuStyleConfig {
  card: {
    base: string;
    image: string;
    hover: string;
    content: string;
  };
  button: {
    primary: string;
    category: {
      active: string;
      inactive: string;
    };
  };
  typography: {
    itemTitle: string;
    itemDescription: string;
    price: string;
    sectionTitle: string;
  };
  badge: {
    featured: string;
    pregnancy: string;
    category: string;
  };
  spacing: {
    cardGap: string;
    sectionGap: string;
  };
  expanded: {
    container: string;
    image: string;
    content: string;
    button: string;
  };
}

export const menuStyles: Record<MenuStyleVariant, MenuStyleConfig> = {
  /**
   * ELEGANT - Inspiration: Michelin / Apple / Japanese Minimal
   */
  elegant: {
    card: {
      base: 'flex flex-col rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-700 cursor-pointer',
      image: 'w-full h-56 rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 mb-4 shadow-2xl flex-shrink-0',
      hover: 'hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1',
      content: 'px-2',
    },
    button: {
      primary: 'rounded-full bg-white text-black px-8 py-3 text-sm font-light tracking-widest hover:bg-neutral-200 transition-all duration-500 uppercase',
      category: {
        active: 'bg-white text-black shadow-2xl scale-105',
        inactive: 'bg-transparent border border-white/10 hover:border-white/30 text-white/60',
      },
    },
    typography: {
      itemTitle: 'text-2xl font-light tracking-tight mb-2 text-white/95',
      itemDescription: 'text-sm text-white/50 mb-4 leading-relaxed font-light italic',
      price: 'text-xl font-light tracking-widest text-white/90',
      sectionTitle: 'text-3xl font-extralight tracking-[0.2em] mb-10 text-center uppercase text-white/40',
    },
    badge: {
      featured: 'text-[10px] tracking-[0.2em] uppercase text-amber-200/80 border border-amber-200/20 px-3 py-1 rounded-full mb-2 inline-block',
      pregnancy: 'text-[10px] tracking-[0.1em] text-emerald-200/70 border border-emerald-200/10 px-3 py-1 rounded-full inline-flex items-center gap-2',
      category: 'hidden',
    },
    spacing: {
      cardGap: 'gap-8',
      sectionGap: 'mb-20',
    },
    expanded: {
      container: 'bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative h-full',
      image: 'relative max-h-[20vh] h-[20vh] w-full grayscale-[0.2] flex-shrink-0 overflow-hidden',
      content: 'flex-1 overflow-y-auto p-10 lg:p-16 text-center min-h-0',
      button: 'w-full rounded-full bg-white text-black py-5 text-sm font-light tracking-[0.3em] uppercase hover:tracking-[0.4em] transition-all duration-700',
    },
  },

  /**
   * COMPACT - Inspiration: Spotify / Airbnb
   */
  compact: {
    card: {
      base: 'flex items-center gap-4 rounded-2xl border border-white/5 bg-white/10 backdrop-blur-md p-3 transition-all duration-300 cursor-pointer',
      image: 'w-24 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0',
      hover: 'hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]',
      content: 'flex-1 min-w-0',
    },
    button: {
      primary: 'rounded-xl bg-white text-black px-4 py-2 text-xs font-bold hover:bg-white/90 transition shadow-sm',
      category: {
        active: 'bg-white text-black font-bold shadow-lg',
        inactive: 'bg-white/5 text-white/70 hover:bg-white/10',
      },
    },
    typography: {
      itemTitle: 'text-base font-bold mb-0.5 truncate text-white',
      itemDescription: 'text-xs text-white/60 mb-2 line-clamp-1',
      price: 'text-sm font-bold text-white',
      sectionTitle: 'text-xl font-black mb-6 flex items-center gap-2 after:h-px after:flex-1 after:bg-white/10',
    },
    badge: {
      featured: 'text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-md mr-2',
      pregnancy: 'text-[10px] font-medium bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md',
      category: 'text-[9px] uppercase tracking-tighter text-white/30 font-bold',
    },
    spacing: {
      cardGap: 'gap-3',
      sectionGap: 'mb-10',
    },
    expanded: {
      container: 'bg-[#121212] border border-white/10 rounded-3xl overflow-hidden flex flex-col relative h-full',
      image: 'relative max-h-[20vh] h-[20vh] w-full flex-shrink-0 overflow-hidden',
      content: 'flex-1 overflow-y-auto p-6 min-h-0',
      button: 'w-full rounded-2xl bg-white text-black py-4 text-base font-bold active:scale-95 transition-all',
    },
  },

  /**
   * BOLD - Inspiration: Street Food / High Contrast
   */
  bold: {
    card: {
      base: 'flex flex-col rounded-none border-l-4 border-white bg-black p-0 transition-all duration-300 cursor-pointer overflow-hidden',
      image: 'w-full h-56 grayscale hover:grayscale-0 transition-all duration-500 flex-shrink-0 overflow-hidden',
      hover: 'hover:border-l-[12px] hover:bg-neutral-900',
      content: 'p-6 border-t border-white/10',
    },
    button: {
      primary: 'rounded-none bg-white text-black px-6 py-4 text-sm font-black hover:invert transition-all uppercase skew-x-[-10deg]',
      category: {
        active: 'bg-white text-black font-black skew-x-[-10deg] px-6',
        inactive: 'bg-black border-2 border-white/20 text-white font-black skew-x-[-10deg] hover:border-white',
      },
    },
    typography: {
      itemTitle: 'text-3xl font-black italic uppercase tracking-tighter mb-1 text-white leading-none',
      itemDescription: 'text-sm text-white/70 mb-6 font-medium tracking-tight uppercase',
      price: 'text-4xl font-black italic text-white mb-4',
      sectionTitle: 'text-6xl font-black italic uppercase tracking-tighter mb-12 text-white/10',
    },
    badge: {
      featured: 'bg-white text-black font-black px-2 py-1 italic text-xs mb-2 inline-block skew-x-[-10deg]',
      pregnancy: 'border-2 border-white text-white font-black px-2 py-1 text-[10px] inline-block uppercase',
      category: 'text-white/20 font-black text-xs uppercase mb-1',
    },
    spacing: {
      cardGap: 'gap-0',
      sectionGap: 'mb-16',
    },
    expanded: {
      container: 'bg-black border-4 border-white rounded-none flex flex-col relative h-full',
      image: 'relative max-h-[20vh] h-[20vh] w-full border-b-4 border-white flex-shrink-0 overflow-hidden',
      content: 'flex-1 overflow-y-auto p-8 min-h-0',
      button: 'w-full rounded-none bg-white text-black py-6 text-2xl font-black italic uppercase hover:bg-neutral-200 transition-all',
    },
  },
};

export function getMenuStyle(variant: MenuStyleVariant = 'elegant'): MenuStyleConfig {
  return menuStyles[variant] || menuStyles.elegant;
}
