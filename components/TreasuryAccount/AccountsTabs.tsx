import { FunctionComponent, useEffect, useState } from 'react'
import { getTreasuryAccountItemInfoV2 } from '@utils/treasuryTools'
import { AssetAccount } from '@utils/uiTypes/assets'
import { getConnectionContext } from '@utils/connection'
import { deprecated } from '@metaplex-foundation/mpl-token-metadata'
import useWalletStore from 'stores/useWalletStore'

interface AccountsTabsProps {
  activeTab: AssetAccount | null
  onChange: (x) => void
  tabs: Array<AssetAccount>
}

const AccountsTabs: FunctionComponent<AccountsTabsProps> = ({
  activeTab,
  onChange,
  tabs,
}) => {
  return (
    <div className={`relative max-h-[1340px] overflow-auto`}>
      <div
        className={`absolute bg-primary-light top-0 default-transition left-0 w-1 z-10`}
        style={{
          transform: `translateY(${
            tabs.findIndex(
              (t) =>
                t.extensions.transferAddress ===
                activeTab?.extensions.transferAddress
            ) * 100
          }%)`,
          height: `${100 / tabs.length}%`,
        }}
      />
      {tabs.map((x) => {
        return (
          <AccountTab
            key={x.pubkey.toBase58()}
            assetAccount={x}
            activeTab={activeTab}
            onChange={onChange}
          />
        )
      })}
    </div>
  )
}

interface AccountTabProps {
  assetAccount: AssetAccount
  activeTab: AssetAccount | null
  onChange: (x) => void
}

const AccountTab: FunctionComponent<AccountTabProps> = ({
  assetAccount,
  activeTab,
  onChange,
}) => {
  const {
    amountFormatted,
    logo,
    name,
    symbol,
    displayPrice,
  } = getTreasuryAccountItemInfoV2(assetAccount)

  const [logoFromMeta, setLogoFromMeta] = useState<undefined | string>(
    undefined
  )
  const [nameFromMeta, setNameFromMeta] = useState<undefined | string>(
    undefined
  )
  const [symbolFromMeta, setSymbolFromMeta] = useState<undefined | string>(
    undefined
  )
  const connection = useWalletStore((s) => s.connection)

  useEffect(() => {
    const getTokenMetadata = async (mintAddress: string) => {
      try {
        const tokenMetaPubkey = await deprecated.Metadata.getPDA(mintAddress)

        const tokenMeta = await deprecated.Metadata.load(
          getConnectionContext(connection.cluster).current,
          tokenMetaPubkey
        )
        setLogoFromMeta(tokenMeta.data?.data.uri)
        setNameFromMeta(tokenMeta.data?.data.name)
        setSymbolFromMeta(tokenMeta.data?.data.symbol)
      } catch (e) {
        console.log(e)
      }
    }
    if (!logo) {
      getTokenMetadata(assetAccount.extensions.mint?.publicKey.toBase58() ?? '')
    }
  })
  return (
    <button
      key={assetAccount.extensions.transferAddress?.toBase58()}
      onClick={() => onChange(assetAccount)}
      className={`cursor-pointer default-transition flex items-center h-24 px-4 relative w-full hover:bg-bkg-3 hover:rounded-md ${
        activeTab?.extensions.transferAddress ===
        assetAccount.extensions.transferAddress
          ? `bg-bkg-3 rounded-md rounded-l-none text-primary-light`
          : `text-fgd-2 hover:text-primary-light`
      }
            `}
    >
      <div className="text-left">
        <h3 className="flex mb-1 text-base font-bold">
          {logo ? (
            <img
              src={logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null // prevents looping
                currentTarget.hidden = true
              }}
              className="w-5 h-5 mr-2"
            />
          ) : logoFromMeta ? (
            <img
              src={logoFromMeta}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null // prevents looping
                currentTarget.hidden = true
              }}
              className="w-5 h-5 mr-2"
            />
          ) : undefined}{' '}
          {nameFromMeta ? nameFromMeta : name}
        </h3>
        <p className="mb-0 text-xs text-fgd-1">
          {amountFormatted} {symbolFromMeta ? symbolFromMeta : symbol}
        </p>
        {displayPrice && (
          <span className="text-xs text-fgd-3">${displayPrice}</span>
        )}
      </div>
    </button>
  )
}

export default AccountsTabs
