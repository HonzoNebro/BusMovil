import React, { forwardRef } from 'react';
import {
  Text as NativeText,
  Pressable as NativePressable,
  TextInput as NativeInput
} from 'react-native';
import { useLanguage } from './Language';
import { translate } from './strings';
export const Text = forwardRef<
  React.ElementRef<typeof NativeText>,
  React.ComponentProps<typeof NativeText>
>(function LocalText(props, ref) {
  const { language } = useLanguage();
  const walk = (value: React.ReactNode): React.ReactNode =>
    typeof value === 'string'
      ? translate(value, language)
      : Array.isArray(value)
      ? value.map(walk)
      : value;
  return (
    <NativeText
      {...props}
      ref={ref}
      accessibilityLabel={
        props.accessibilityLabel
          ? translate(props.accessibilityLabel, language)
          : undefined
      }
    >
      {walk(props.children)}
    </NativeText>
  );
});
export const Pressable = forwardRef<
  React.ElementRef<typeof NativePressable>,
  React.ComponentProps<typeof NativePressable>
>(function LocalPressable(props, ref) {
  const { language } = useLanguage();
  return (
    <NativePressable
      {...props}
      ref={ref}
      accessibilityLabel={
        props.accessibilityLabel
          ? translate(props.accessibilityLabel, language)
          : undefined
      }
      accessibilityHint={
        props.accessibilityHint
          ? translate(props.accessibilityHint, language)
          : undefined
      }
    />
  );
});
export const TextInput = forwardRef<
  React.ElementRef<typeof NativeInput>,
  React.ComponentProps<typeof NativeInput>
>(function LocalInput(props, ref) {
  const { language } = useLanguage();
  return (
    <NativeInput
      {...props}
      ref={ref}
      placeholder={
        props.placeholder ? translate(props.placeholder, language) : undefined
      }
      accessibilityLabel={
        props.accessibilityLabel
          ? translate(props.accessibilityLabel, language)
          : undefined
      }
    />
  );
});
