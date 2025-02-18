import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { hexStripZeros } from '@ethersproject/bytes';
import _ from 'lodash';
import { Hex } from '@metamask/utils';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Display,
  FlexWrap,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import { Box } from '../../../../../../../components/component-library';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import Preloader from '../../../../../../../components/ui/icon/preloader';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types/transaction-decode';
import { UniswapPathPool } from '../../../../../../../../app/scripts/lib/transaction/decode/uniswap';
import { useConfirmContext } from '../../../../../context/confirm';

export const TransactionData = () => {
  const { currentConfirmation } = useConfirmContext() as unknown as {
    currentConfirmation: TransactionMeta | undefined;
  };

  const transactionData = currentConfirmation?.txParams?.data as Hex;
  const decodeResponse = useDecodedTransactionData();

  const { value, pending } = decodeResponse;

  if (pending) {
    return <Container isLoading />;
  }

  if (!transactionData?.length) {
    return null;
  }

  if (!value) {
    return (
      <Container transactionData={transactionData}>
        <RawDataRow transactionData={transactionData} />
      </Container>
    );
  }

  const { data, source } = value;
  const isExpandable = data.length > 1;

  return (
    <Container transactionData={transactionData}>
      <>
        {data.map((method, index) => (
          <React.Fragment key={index}>
            <FunctionContainer
              method={method}
              source={source}
              isExpandable={isExpandable}
            />
            {index < data.length - 1 && <ConfirmInfoRowDivider />}
          </React.Fragment>
        ))}
      </>
    </Container>
  );
};

export function Container({
  children,
  isLoading,
  transactionData,
}: {
  children?: React.ReactNode;
  isLoading?: boolean;
  transactionData?: string;
}) {
  const t = useI18nContext();

  return (
    <>
      <ConfirmInfoSection data-testid="advanced-details-data-section">
        <ConfirmInfoRow
          label={t('advancedDetailsDataDesc')}
          copyEnabled={Boolean(transactionData)}
          copyText={transactionData || undefined}
        >
          <Box>{isLoading && <Preloader size={20} />}</Box>
        </ConfirmInfoRow>
        {children}
      </ConfirmInfoSection>
    </>
  );
}

function RawDataRow({ transactionData }: { transactionData: string }) {
  const t = useI18nContext();
  return (
    <ConfirmInfoRow label={t('advancedDetailsHexDesc')}>
      <ConfirmInfoRowText
        data-testid="advanced-details-transaction-hex"
        text={transactionData}
      />
    </ConfirmInfoRow>
  );
}

function FunctionContainer({
  method,
  source,
  isExpandable,
}: {
  method: DecodedTransactionDataMethod;
  source?: DecodedTransactionDataSource;
  isExpandable: boolean;
}) {
  const t = useI18nContext();

  const paramRows = (
    <Box paddingLeft={2}>
      {method.params.map((param, paramIndex) => (
        <ParamRow
          key={paramIndex}
          param={param}
          index={paramIndex}
          source={source}
        />
      ))}
    </Box>
  );

  if (isExpandable) {
    return (
      <ConfirmInfoExpandableRow
        label={t('transactionDataFunction')}
        tooltip={method.description}
        content={paramRows}
        startExpanded
      >
        <ConfirmInfoRowText
          data-testid="advanced-details-data-function"
          text={method.name}
        />
      </ConfirmInfoExpandableRow>
    );
  }

  return (
    <>
      <ConfirmInfoRow
        data-testid="advanced-details-data-function"
        label={t('transactionDataFunction')}
        tooltip={method.description}
      >
        <ConfirmInfoRowText text={method.name} />
      </ConfirmInfoRow>
      {paramRows}
    </>
  );
}

function ParamValue({
  param,
  source,
}: {
  param: DecodedTransactionDataParam;
  source?: DecodedTransactionDataSource;
}) {
  const { name, type, value } = param;

  if (type === 'address') {
    return <ConfirmInfoRowAddress address={value} />;
  }

  if (name === 'path' && source === DecodedTransactionDataSource.Uniswap) {
    return <UniswapPath pathPools={value} />;
  }

  let valueString = value.toString();

  if (!Array.isArray(value) && valueString.startsWith('0x')) {
    valueString = hexStripZeros(valueString);
  }

  return <ConfirmInfoRowText text={valueString} />;
}

function ParamRow({
  param,
  index,
  source,
}: {
  param: DecodedTransactionDataParam;
  index: number;
  source?: DecodedTransactionDataSource;
}) {
  const { name, type, description } = param;
  const label = name ? _.startCase(name) : `Param #${index + 1}`;
  const tooltip = `${type}${description ? ` - ${description}` : ''}`;
  const dataTestId = `advanced-details-data-param-${index}`;

  const childRows = param.children?.map((childParam, childIndex) => (
    <ParamRow
      key={childIndex}
      param={childParam}
      index={childIndex}
      source={source}
    />
  ));

  return (
    <>
      <ConfirmInfoRow label={label} tooltip={tooltip} data-testid={dataTestId}>
        {!childRows?.length && <ParamValue param={param} source={source} />}
      </ConfirmInfoRow>
      {childRows && <Box paddingLeft={2}>{childRows}</Box>}
    </>
  );
}

function UniswapPath({ pathPools }: { pathPools: UniswapPathPool[] }) {
  return (
    <Box
      display={Display.Flex}
      flexWrap={FlexWrap.Wrap}
      justifyContent={JustifyContent.flexEnd}
    >
      {pathPools.map((pool, index) => (
        <>
          {index === 0 && <ConfirmInfoRowAddress address={pool.firstAddress} />}
          <ConfirmInfoRowText text={String(pool.tickSpacing)} />
          <ConfirmInfoRowAddress address={pool.secondAddress} />
        </>
      ))}
    </Box>
  );
}
