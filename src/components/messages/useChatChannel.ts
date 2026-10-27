import { useEffect, useMemo, useState } from 'react';
import type { MessageJSON } from './api';

export type OutChannel = 'TELEGRAM' | 'WEB';

export function useChatChannel(
  messages: MessageJSON[],
  hasTelegramContact: boolean,
  webToken: string | null
) {
  const lastIncoming = useMemo(
    () => [...messages].reverse().find((m) => m.direction === 'IN'),
    [messages],
  );

  const lastIncomingChannel: OutChannel | null =
    lastIncoming?.channel === 'WEB'
      ? 'WEB'
      : lastIncoming?.channel === 'TELEGRAM' || lastIncoming?.channel === 'MAX'
        ? 'TELEGRAM'
        : null;

  const initialChannel: OutChannel | null =
    lastIncomingChannel ??
    (hasTelegramContact ? 'TELEGRAM' : webToken ? 'WEB' : null);

  const [outChannel, setOutChannel] = useState<OutChannel | null>(
    initialChannel,
  );

  useEffect(() => {
    setOutChannel((current) => {
      if (current === 'TELEGRAM' && !hasTelegramContact) {
        return webToken ? 'WEB' : null;
      }
      if (current === 'WEB' && !webToken) {
        return hasTelegramContact ? 'TELEGRAM' : null;
      }
      if (current === null) {
        return lastIncomingChannel ?? initialChannel;
      }
      return current;
    });
  }, [hasTelegramContact, webToken, lastIncomingChannel, initialChannel]);

  const availableChannels: OutChannel[] = [];
  if (hasTelegramContact) availableChannels.push('TELEGRAM');
  if (webToken) availableChannels.push('WEB');
  
  return {
    outChannel,
    setOutChannel,
    availableChannels,
    showChannelPicker: availableChannels.length > 1,
    noChannelAvailable: availableChannels.length === 0,
  };
}