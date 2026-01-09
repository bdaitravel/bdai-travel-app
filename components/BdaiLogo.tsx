
import React, { useId } from 'react';

export const BdaiLogo = ({ className }: { className?: string }) => {
  const uid = useId();
  const fixId = (id: string) => `${uid}-${id}`;
  const urlId = (id: string) => `url(#${fixId(id)})`;

  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 375 375" 
      fill="none"
    >
      <defs>
        <clipPath id={fixId("ac14b6d9a9")}><path d="M 93.621094 117.652344 L 281.378906 117.652344 L 281.378906 305.40625 L 93.621094 305.40625 Z" clipRule="nonzero"/></clipPath>
        <clipPath id={fixId("6de14c7f9b")}><path d="M 187.5 117.652344 C 135.652344 117.652344 93.621094 159.683594 93.621094 211.527344 C 93.621094 263.375 135.652344 305.40625 187.5 305.40625 C 239.347656 305.40625 281.378906 263.375 281.378906 211.527344 C 281.378906 159.683594 239.347656 117.652344 187.5 117.652344 Z" clipRule="nonzero"/></clipPath>
        <clipPath id={fixId("d437cdab7b")}><path d="M 93.625 69.734375 L 158.875 69.734375 L 158.875 266.984375 L 93.625 266.984375 Z" clipRule="nonzero"/></clipPath>
        <clipPath id={fixId("df3fea99b9")}><path d="M 151.710938 143.445312 L 187.710938 143.445312 L 187.710938 238.695312 L 151.710938 238.695312 Z" clipRule="nonzero"/></clipPath>
      </defs>
      
      {/* Círculo fondo amarillo */}
      <g clipPath={urlId("ac14b6d9a9")}>
        <g clipPath={urlId("6de14c7f9b")}>
          <path fill="#f6c604" d="M 93.621 117.652 L 281.379 117.652 L 281.379 305.406 L 93.621 305.406 Z" fillRule="nonzero"/>
        </g>
      </g>

      {/* Estructura lateral amarilla */}
      <g clipPath={urlId("d437cdab7b")}>
        <path fill="#f6c604" d="M 93.625 69.691 L 93.625 201.508 C 93.625 237.613 122.895 266.883 159.004 266.883 L 159.004 135.070 C 159.004 98.961 129.730 69.691 93.625 69.691 Z" fillRule="nonzero"/>
      </g>

      {/* Gota superior morada */}
      <g clipPath={urlId("df3fea99b9")}>
        <g transform="matrix(1, 0, 0, 1, 151, 143)">
          <path fill="#5e17eb" d="M 36.852 93.629 C 42.523 91.141 70.75 54.609 70.75 35.789 C 70.75 16.832 55.809 1.887 36.852 1.887 C 17.891 1.887 2.949 17.109 2.949 36.344 C 2.949 55.023 31.176 91.141 36.852 93.629 Z" fillRule="nonzero"/>
        </g>
      </g>

      {/* Gota inferior morada */}
      <path fill="#5e17eb" d="M 186.871 277.535 C 181.199 275.043 152.969 238.512 152.969 219.695 C 152.969 200.734 167.914 185.793 186.871 185.793 C 205.828 185.793 220.773 201.012 220.773 220.246 C 220.773 238.930 192.547 275.043 186.871 277.535 Z" fillRule="nonzero"/>
      
      {/* Línea de detalle */}
      <path transform="matrix(0, -0.75, 0.75, 0, 186.983, 279.609)" d="M 0 0.5 L 181.562 0.5" stroke="#5e17eb" strokeWidth="1" strokeMiterlimit="4"/>
    </svg>
  );
};
