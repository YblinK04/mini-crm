
import type { ChannelAdapter, ChannelName } from './types';
import { TelegramAdapter } from './telegram/adapter';

const adapters: Partial<Record<ChannelName, ChannelAdapter>> = {
  TELEGRAM: new TelegramAdapter(),
};

export function getAdapter(channel: string): ChannelAdapter {
  const key = channel.toUpperCase() as ChannelName;
  const adapter = adapters[key];

  if (!adapter) {
    throw new Error(`[channels] Unknown channel: ${channel}`);
  }
  return adapter;
}

export function getAllChannels(): ChannelName[] {
  return Object.keys(adapters) as ChannelName[];
}