export const CURSOR_ROLES = [
    'all-resize', 'grab', 'nw-resize', 'size_fdiag',
    'all-scroll', 'grabbing', 'nwse-resize', 'size_hor',
    'arrow', 'half-busy', 'openhand', 'size_ver',
    'bd_double_arrow', 'hand', 'pencil', 'spinner',
    'bottom_left_corner', 'hand1', 'person', 'split_h',
    'bottom_right_corner', 'hand2', 'pin', 'split_v',
    'bottom_side', 'h_double_arrow', 'pirate', 's-resize',
    'circle', 'help', 'plus', 'sw-resize',
    'closedhand', 'ibeam', 'pointer', 'tcross',
    'col-resize', 'left_ptr', 'pointing_hand', 'text',
    'cross', 'left_ptr_arrow', 'progress', 'top_left_arrow',
    'crossed_circle', 'left_ptr_help', 'question_arrow', 'top_left_corner',
    'crosshair', 'left_ptr_watch', 'right_side', 'top_right_corner',
    'cross_reverse', 'left_side', 'row-resize', 'top_side',
    'default', 'link', 'sb_down_arrow', 'v_double_arrow',
    'diamond_cross', 'move', 'sb_h_double_arrow', 'wait',
    'dnd-move', 'ne-resize', 'sb_left_arrow', 'watch',
    'dnd-none', 'nesw-resize', 'sb_right_arrow', 'wayland-cursor',
    'e-resize', 'no-drop', 'sb_up_arrow', 'whats_this',
    'ew-resize', 'not-allowed', 'sb_v_double_arrow', 'w-resize',
    'fd_double_arrow', 'not_allowed', 'se-resize', 'xterm',
    'fleur', 'n-resize', 'size_all',
    'forbidden', 'ns-resize', 'size_bdiag'
] as const;

export type CursorRole = typeof CURSOR_ROLES[number];
