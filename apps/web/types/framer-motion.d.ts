import * as React from 'react';

declare module 'framer-motion' {
    interface MotionProps {
        className?: string;
        onClick?: React.MouseEventHandler<any>;
    }
}
