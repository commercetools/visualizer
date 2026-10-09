/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import { FC } from 'react';
import { FormField, Stack, TextInput } from '@commercetools/nimbus';
import messages from './messages';
import formMessages from '../extensions-form/messages';
import { TFormValues } from '../extensions-form/extensions-form';

type Props = {
  isReadOnly?: boolean;
};

const ExtensionsDestinationsFormGcf: FC<Props> = ({ isReadOnly }) => {
  const intl = useIntl();
  const formik = useFormikContext<TFormValues>();
  return (
    <Stack direction="column" gap="400">
      <FormField.Root
        isRequired
        isReadOnly={isReadOnly}
        isInvalid={Boolean(
          formik.touched.destinationGcfUrl && formik.errors.destinationGcfUrl
        )}
      >
        <FormField.Label>
          {intl.formatMessage(messages.destinationGcfUrl)}
        </FormField.Label>
        <FormField.Input>
          <TextInput
            aria-label={intl.formatMessage(messages.destinationGcfUrl)}
            value={formik.values.destinationGcfUrl || ''}
            isReadOnly={isReadOnly}
            onChange={(value) =>
              formik.setFieldValue('destinationGcfUrl', value)
            }
            onBlur={() => formik.setFieldTouched('destinationGcfUrl', true)}
            width={'full'}
          />
        </FormField.Input>
        <FormField.Error>
          {formik.touched.destinationGcfUrl && formik.errors.destinationGcfUrl
            ? intl.formatMessage(formMessages.requiredFieldError)
            : null}
        </FormField.Error>
      </FormField.Root>
    </Stack>
  );
};

export default ExtensionsDestinationsFormGcf;
