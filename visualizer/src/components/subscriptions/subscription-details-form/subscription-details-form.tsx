/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { FC, JSX, ReactElement } from 'react';
import { useFormik, type FormikHelpers, FormikProvider } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import omitEmpty from 'omit-empty-es';
import messages from './messages';
import SubscriptionDestinationTypeForm from '../subscription-destination-type-form/subscription-destination-type-form';
import {
  TAzureServiceBusDestination,
  TChangeSubscriptionInput,
  TEventBridgeDestination,
  TEventGridDestination,
  TGoogleCloudPubSubDestination,
  TEventSubscriptionInput,
  TMessageSubscriptionInput,
  TSnsDestination,
  TSqsDestination,
  TConfluentCloudDestination,
} from '../../../types/generated/ctp';
import SubscriptionDestinationForm from '../subscription-destination-form/subscription-destination-form';
import SubscriptionChangesForm from '../subscription-changes-form/subscription-changes-form';
import SubscriptionMessagesForm from '../subscription-messages-form/subscription-messages-form';
import SubscriptionEventsForm from '../subscription-events-form/subscription-events-form';
import SubscriptionFormatForm from '../subscription-format-form/subscription-format-form';
import {
  Accordion,
  Flex,
  FormField,
  PageContent,
  TextInput,
} from '@commercetools/nimbus';
import { validateKey } from '../../../utils/validate-key';
import KeyInputError, {
  TKeyInputError,
} from '../../shared/key-input-error/key-input-error';
import keyInputMessages from '../../shared/key-input-error/messages';

type Formik = ReturnType<typeof useFormik>;

export type TFormValues = {
  id: string;
  key: string;
  destinationType:
    | 'AzureServiceBus'
    | 'ConfluentCloud'
    | 'EventBridge'
    | 'EventGrid'
    | 'GoogleCloudPubSub'
    | 'SNS'
    | 'SQS'
    | string;
  destination:
    | {
        GoogleCloudPubSub?: TGoogleCloudPubSubDestination;
        SQS?: TSqsDestination;
        ConfluentCloud?: TConfluentCloudDestination;
        SNS?: TSnsDestination;
        EventBridge?: TEventBridgeDestination;
        AzureServiceBus?: TAzureServiceBusDestination;
        EventGrid?: TEventGridDestination;
      }
    | undefined;
  changes?: Array<TChangeSubscriptionInput> | null;
  messages?: Array<TMessageSubscriptionInput> | null;
  events?: Array<TEventSubscriptionInput> | null;
  // Delivery format; immutable once the subscription exists (no update action).
  format?: {
    type: 'Platform' | 'CloudEvents' | string;
    cloudEventsVersion?: string;
  };
};

type TErrors = {
  // `duplicate` isn't set by client-side validation — it comes from
  // subscription-details-page.tsx's DuplicateField errorCodeMapping via
  // graphQLErrorHandler's setErrors.
  key: { missing?: boolean; invalidInput?: boolean; duplicate?: boolean };
  format?: { cloudEventsVersion: { missing: boolean } };
};

// Dotted paths of every leaf of a (nested) Formik errors object.
const touchErrorPaths = (errors: unknown, prefix = ''): string[] =>
  errors !== null && typeof errors === 'object'
    ? Object.entries(errors).flatMap(([key, value]) =>
        touchErrorPaths(value, prefix ? `${prefix}.${key}` : key)
      )
    : prefix
    ? [prefix]
    : [];

const validate = (formikValues: TFormValues): TErrors => {
  // The delivery format can only be chosen on create; for an existing subscription it is
  // read-only, so there is nothing the user could fix.
  const formatErrors =
    !formikValues.id &&
    formikValues.format?.type === 'CloudEvents' &&
    !formikValues.format.cloudEventsVersion?.trim()
      ? { cloudEventsVersion: { missing: true } }
      : undefined;
  return omitEmpty<TErrors>({
    key: validateKey(formikValues.key),
    format: formatErrors,
  });
};

type FormProps = {
  formElements: ReactElement;
  values: Formik['values'];
  isDirty: Formik['dirty'];
  isSubmitting: Formik['isSubmitting'];
  submitForm: Formik['handleSubmit'];
  handleReset: Formik['handleReset'];
};

type Props = {
  onSubmit: (
    values: TFormValues,
    formikHelpers: FormikHelpers<TFormValues>
  ) => void | Promise<unknown>;
  initialValues: TFormValues;
  isReadOnly?: boolean;
  dataLocale: string;
  children: (formProps: FormProps) => JSX.Element;
};

const SubscriptionDetailsForm: FC<Props> = ({
  children,
  initialValues,
  onSubmit,
  isReadOnly,
}) => {
  const intl = useIntl();
  const formik = useFormik<TFormValues>({
    initialValues: initialValues,
    onSubmit: onSubmit,
    validate: validate,
    enableReinitialize: true,
  });
  // Formik only marks the fields present in `values` as touched on submit. The destination
  // fields are validated per field and are absent from `values` until typed into, so their
  // errors would stay hidden and Create would silently do nothing. Touch every field that
  // currently has an error when submitting.
  const submitForm: FormProps['submitForm'] = async (event) => {
    event?.preventDefault?.();
    const errors = await formik.validateForm();
    // The submit attempt resets `touched`, so ours has to be applied after it. Validating
    // happens before submitting so it cannot overwrite server errors set by onSubmit.
    formik.handleSubmit();
    touchErrorPaths(errors).forEach((path) =>
      formik.setFieldTouched(path, true, false)
    );
  };
  const formElements = (
    <FormikProvider value={formik}>
      <PageContent.Root variant={'wide'}>
        <Flex direction="column" gap="400">
          <FormField.Root
            isRequired
            isReadOnly={isReadOnly}
            isInvalid={Boolean(formik.touched.key && formik.errors.key)}
          >
            <FormField.Label>
              <FormattedMessage {...messages.subscriptionKeyLabel} />
            </FormField.Label>
            <FormField.Input>
              <TextInput
                name="key"
                value={formik.values.key || ''}
                isReadOnly={isReadOnly}
                onChange={(value) => formik.setFieldValue('key', value)}
                onBlur={() => formik.setFieldTouched('key', true)}
                width={'full'}
              />
            </FormField.Input>
            <FormField.Description>
              {intl.formatMessage(keyInputMessages.keyHint)}
            </FormField.Description>
            <FormField.Error>
              <KeyInputError
                error={formik.errors.key as TKeyInputError}
                resourceType="subscription"
              />
            </FormField.Error>
          </FormField.Root>
          <SubscriptionFormatForm
            isReadOnly={isReadOnly || Boolean(formik.values.id)}
          />
          <Accordion.Root
            allowsMultipleExpanded
            defaultExpandedKeys={['destination']}
          >
            <Accordion.Item value="destination">
              <Accordion.Header>
                <FormattedMessage {...messages.destinationSectionTitle} />
              </Accordion.Header>
              <Accordion.Content>
                <SubscriptionDestinationTypeForm isReadOnly={isReadOnly} />
                <SubscriptionDestinationForm
                  destinationType={formik.values.destinationType}
                  isReadOnly={isReadOnly}
                />
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="changes">
              <Accordion.Header>
                <FormattedMessage {...messages.changesSectionTitle} />
              </Accordion.Header>
              <Accordion.Content>
                <SubscriptionChangesForm isReadOnly={isReadOnly} />
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="messages">
              <Accordion.Header>
                <FormattedMessage {...messages.messagesSectionTitle} />
              </Accordion.Header>
              <Accordion.Content>
                <SubscriptionMessagesForm isReadOnly={isReadOnly} />
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="events">
              <Accordion.Header>
                <FormattedMessage {...messages.eventsSectionTitle} />
              </Accordion.Header>
              <Accordion.Content>
                <SubscriptionEventsForm isReadOnly={isReadOnly} />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </Flex>
      </PageContent.Root>
    </FormikProvider>
  );

  return children({
    formElements,
    values: formik.values,
    isDirty: formik.dirty,
    isSubmitting: formik.isSubmitting,
    submitForm,
    handleReset: formik.handleReset,
  });
};

SubscriptionDetailsForm.displayName = 'SubscriptionDetailsForm';

export default SubscriptionDetailsForm;
