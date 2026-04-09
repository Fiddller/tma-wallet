import { useState } from 'react';
import { Banner } from '@telegram-apps/telegram-ui';

export function MarketingBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <Banner
        header="2$ в Золоте за первую P2P-сделку от 50 USDT"
        subheader="Попробовать >"
        onCloseIcon={() => setVisible(false)}
        type="section"
      />
    </div>
  );
}
