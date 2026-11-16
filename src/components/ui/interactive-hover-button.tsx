import type {AnchorHTMLAttributes,ButtonHTMLAttributes,ReactNode} from 'react';
import {ArrowRight} from 'lucide-react';
import {cn} from '../../lib/utils';

type CommonProps={children:ReactNode;className?:string;fullWidth?:boolean};
type ButtonProps=CommonProps&ButtonHTMLAttributes<HTMLButtonElement>&{href?:never};
type LinkProps=CommonProps&AnchorHTMLAttributes<HTMLAnchorElement>&{href:string};
export type InteractiveHoverButtonProps=ButtonProps|LinkProps;

/** Adapted from user_magicui's Interactive Hover Button, MotionSites registry.
 * Adds link semantics, keyboard focus, reduced motion and touch support.
 */
export function InteractiveHoverButton(props:InteractiveHoverButtonProps){
 const {children,className,fullWidth=false,...rest}=props;
 const classes=cn('interactive-hover-button group relative isolate inline-flex min-h-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-background px-7 py-3 text-center text-sm font-semibold text-foreground transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',fullWidth?'w-full':'w-auto',className);
 const content=<>
  <span aria-hidden="true" className="hover-button-dot pointer-events-none absolute left-6 h-2 w-2 rounded-full bg-primary transition-transform duration-500 group-hover:scale-[180] group-focus-visible:scale-[180] motion-reduce:transition-none"/>
  <span className="hover-button-rest relative flex items-center justify-center gap-3 transition-[transform,opacity] duration-300 group-hover:translate-x-8 group-hover:opacity-0 group-focus-visible:translate-x-8 group-focus-visible:opacity-0 motion-reduce:transition-none"><span className="w-2"/>{children}</span>
  <span aria-hidden="true" className="hover-button-active pointer-events-none absolute inset-0 flex translate-x-8 items-center justify-center gap-3 text-primary-foreground opacity-0 transition-[transform,opacity] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none">{children}<ArrowRight size={18} strokeWidth={1.8}/></span>
 </>;
 return 'href' in rest&&rest.href?<a {...rest as AnchorHTMLAttributes<HTMLAnchorElement>} href={rest.href} className={classes}>{content}</a>:<button type="button" {...rest as ButtonHTMLAttributes<HTMLButtonElement>} className={classes}>{content}</button>;
}
