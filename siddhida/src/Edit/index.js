/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { OrderedMap, Map } from 'immutable';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {
  Layout,
  Table,
  Card,
  PageHeader,
  Tag,
  Col,
  Row,
  Spin,
  Button,
  InputNumber,
  DatePicker,
  Input,
  Select,
  Popover,
  Tooltip,
} from 'antd';
import DescriptionList from 'ant-design-pro/lib/DescriptionList';
import moment from 'moment';
import { PdfLoader, PdfHighlighter, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import debounce from 'lodash/debounce';
import { v4 as uuidv4 } from 'uuid';
import {
  CloseOutlined,
  DeleteOutlined,
  InfoCircleTwoTone,
  PlusOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SaveOutlined,
  SettingTwoTone,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import {
  getUTCInMonthName,
  invStatusCodes,
  getUTCForInvoiceExtraction,
  errorMessage,
  roundTo,
  lineItemTotals,
  formRequiredRule,
  findSubUoms,
} from '../../../../utils/helpers';
import { ContentStyle, ContentDiv } from '../../../../global-styles';
import LoadingContent from '../../../../components/LoadingContent';
import './styles.css';
import LineItemTaxesNew from '../../../../components/LineItemTaxesNew';
import {
  getActiveTaxes,
  getUOMsWithSubUoms,
  getUOMs,
  getActivePaymentTerms,
  displayActivityOverlay,
  displayCommentsOverlay,
} from '../../../../actions';
import Activity from '../../../../components/Activity';
import { getSuppliers, getSupplierDetails } from '../../../Suppliers/actions';
import { amendOCRInvoice } from '../../../Invoices/Edit/actions';
import { formItemStyle } from '../../../../utils/commons';
import PaymentTermsPopover from '../../../../components/PaymentTermsPopover';
import CurrencySelectModal from '../../../../components/CurrencySelectModal';
import PaymentTermsModal from '../../../../components/PaymentTermsModal';
import { GET_PT, STORE_PT } from '../../constants';

const { Content } = Layout;
const { Description } = DescriptionList;
const { Option } = Select;

const detailsStyle = { fontSize: '12px' };
const inputStyle = {
  width: '15vw',
};

const selectStyle = {
  width: '15vw',
};

const additionalFieldsLabel = {
  customerInformation: 'Customer Information',
  otherInformation: 'Other Information',
  paymentInformation: 'Payment Information',
  senderInformation: 'Sender Information',
};

const additionalFieldKeys = {
  customerInformation: {
    address: 'Address',
    city: 'City',
    supplierCompanyName: 'Company Name',
    contactMail: 'Contact Mail',
    contactName: 'Contact Name',
    country: 'Country',
    customerNumber: 'Customer Number',
    postcode: 'Post Code',
  },
  otherInformation: {
    nonEU: 'Non EU',
    shippingCost: 'Shipping Cost',
    taxRateExemption: 'Tax Rate Exemption',
  },
  paymentInformation: {
    bank: 'Bank',
    bic: 'BIC',
    ibanAll: 'IBAN',
    method: 'Method',
    note: 'Note',
    dueDate: 'Due Date',
    type: 'Type',
    // terms: 'Terms',
  },
  senderInformation: {
    address: 'Address',
    city: 'City',
    companyName: 'Company Name',
    contactMail: 'Contact Mail',
    contactName: 'Contact Name',
    country: 'Country',
    customerPhone: 'Customer Number',
    postcode: 'Post Code',
    taxNumber: 'Tax Number',
    vatId: 'VAT ID',
  },
};

class InvoicesVerifyEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageLoader: true,
      locationData: {},
      isEdit: false,
      tableData: OrderedMap(),
      tableDataIndex: 1,
      tableDataPopulated: false,
      subUOMMap: Map(),
      disabledFields: {},
      initialValues: {},
      selectedCurrency: Map(),
      clickedHighlight: {},
      selectedFields: {
        key: undefined,
        type: undefined,
      },
      newHighlights: {},
      currentZoom: 75,
      currentRotation: 0,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.loadDataInState) {
      let tableData = OrderedMap();
      let tableDataIndex = 1;
      const tempMap = state.subUOMMap;
      props.invoiceDetails
        .getIn(['locationData', 'items'])
        .toArray()
        .forEach((item, rowIndex) => {
          const tableDataItem = {
            key: tableDataIndex,
            index: rowIndex,
            id: item.get('lineItemId'),
            product: item.getIn(['name', 'word']) ? Array(item.getIn(['name', 'word'])) : [],
            'product-highlightId': item.getIn(['name', 'cellId']),
            'product-confidence': item.getIn(['name', 'confidence']),
            quantity: item.getIn(['quantity', 'word']) ? Array(item.getIn(['quantity', 'word']).toString()) : [],
            'quantity-highlightId': item.getIn(['quantity', 'cellId']),
            'quantity-confidence': item.getIn(['quantity', 'confidence']),
            price: item.getIn(['price', 'word']) ? Array(item.getIn(['price', 'word']).toString()) : [],
            'price-highlightId': item.getIn(['price', 'cellId']),
            'price-confidence': item.getIn(['price', 'confidence']),
            lineItemTotal: item.getIn(['lineItemTotal', 'word'])
              ? Array(item.getIn(['lineItemTotal', 'word']).toString())
              : [],
            'lineItemTotal-highlightId': item.getIn(['lineItemTotal', 'cellId']),
            'lineItemTotal-confidence': item.getIn(['lineItemTotal', 'confidence']),
            // taxes: [],
            taxPercent: item.getIn(['taxPercent', 'word']) ? Array(item.getIn(['taxPercent', 'word']).toString()) : [],
            'taxPercent-highlightId': item.getIn(['taxPercent', 'cellId']),
            'taxPercent-confidence': item.getIn(['taxPercent', 'confidence']),
            selectedTaxIds: [],
            isNonStockItem: true,
            // uom: null,
            uom: item.getIn(['uom', 'word']) ? Array(item.getIn(['uom', 'word']).toString()) : [],
            'uom-highlightId': item.getIn(['uom', 'cellId']),
            'uom-confidence': item.getIn(['uom', 'confidence']),
            deleted: !item.get('active'),
          };
          tableDataItem['product-highlight'] = {};
          tableDataItem['product-highlight'][item.getIn(['name', 'word'])] = item.getIn(['name', 'cellId']);
          tableDataItem['quantity-highlight'] = {};
          tableDataItem['quantity-highlight'][item.getIn(['quantity', 'word'])] = item.getIn(['quantity', 'cellId']);
          tableDataItem['price-highlight'] = {};
          tableDataItem['price-highlight'][item.getIn(['price', 'word'])] = item.getIn(['price', 'cellId']);
          tableDataItem['lineItemTotal-highlight'] = {};
          tableDataItem['lineItemTotal-highlight'][item.getIn(['lineItemTotal', 'word'])] = item.getIn([
            'lineItemTotal',
            'cellId',
          ]);
          tableDataItem['taxPercent-highlight'] = {};
          tableDataItem['taxPercent-highlight'][item.getIn(['taxPercent', 'word'])] = item.getIn([
            'taxPercent',
            'cellId',
          ]);
          tableDataItem['uom-highlight'] = {};
          tableDataItem['uom-highlight'][item.getIn(['uom', 'word'])] = item.getIn(['uom', 'cellId']);
          tableData = tableData.set(tableDataIndex, tableDataItem);
          tableDataIndex += 1;
        });

      const subTotalValue = props.invoiceDetails.getIn(['locationData', 'subTotal', 'word']);
      const totalTaxesValue = props.invoiceDetails.getIn(['locationData', 'totalTaxes', 'word']);
      const valueValue = props.invoiceDetails.getIn(['locationData', 'value', 'word']);
      const subTotal = subTotalValue ? Array(subTotalValue.toString()) : [];
      const totalTaxes = totalTaxesValue ? Array(totalTaxesValue.toString()) : [];
      const value = valueValue ? Array(valueValue.toString()) : [];
      const initialValues = {
        supplier: props.invoiceDetails.getIn(['Supplier', 'id']),
        subTotal,
        totalTaxes,
        value,
      };
      initialValues[`subTotal-highlight`] = {};
      initialValues[`subTotal-highlight`][
        props.invoiceDetails.getIn(['locationData', 'subTotal', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'subTotal', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'subTotal', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'subTotal').id;
      initialValues[`subTotal-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === `subTotal`).id;
      initialValues[`totalTaxes-highlight`] = {};
      initialValues[`totalTaxes-highlight`][
        props.invoiceDetails.getIn(['locationData', 'totalTaxes', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'totalTaxes', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'totalTaxes', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'totalTaxes').id;
      initialValues[`totalTaxes-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === `totalTaxes`).id;
      initialValues[`value-highlight`] = {};
      initialValues[`value-highlight`][
        props.invoiceDetails.getIn(['locationData', 'value', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'value', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'value', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'value').id;
      initialValues[`value-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === `value`).id;
      initialValues[`subTotal-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'subTotal').confidence;
      initialValues[`totalTaxes-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'totalTaxes').confidence;
      initialValues[`value-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'value').confidence;
      const baseCurrencyId = props.baseCurrency.get('id');
      let selectedCurrency = Map();
      let currencySymbol;
      const disabledFields = {};
      if (props.supplierDetails) {
        const data = props.supplierDetails
          .get('SCMs')
          .valueSeq()
          .toArray()
          .find(scm => scm.get('currencyId') === props.invoiceDetails.get('currencyId'));
        if (data) {
          const isCurrencyDisable = baseCurrencyId === data.get('currencyId');
          initialValues.allowedCurrency = data.get('currencyId');
          const currencyObject = data.get('Currency').toJS();
          selectedCurrency = selectedCurrency.set(currencyObject.id, {
            currencyName: currencyObject.name,
            exchangeRate:
              props.invoiceDetails.get('transactionCurrencyExchangeRate') ||
              props.invoiceDetails.get('transactionCurrencyExchangeRate') === 0
                ? props.invoiceDetails.get('transactionCurrencyExchangeRate')
                : currencyObject.exchangeRate,
            conversionType: props.invoiceDetails.get('exchangeCalculatedBy') || currencyObject.conversionType,
            symbol: currencyObject.symbol,
            isCurrencyDisable: props.supplierDetails.get('SCMs').size === 1 && isCurrencyDisable,
            currencyId: currencyObject.id,
          });
          currencySymbol = currencyObject.symbol;
          disabledFields.allowedCurrency = props.supplierDetails.get('SCMs').size === 1;
        }
      }

      initialValues.supplierInvoiceNumber = props.invoiceDetails.getIn([
        'locationData',
        'supplierInvoiceNumber',
        'word',
      ])
        ? Array(props.invoiceDetails.getIn(['locationData', 'supplierInvoiceNumber', 'word']).toString())
        : [];
      initialValues[`supplierInvoiceNumber-highlight`] = {};
      initialValues[`supplierInvoiceNumber-highlight`][
        props.invoiceDetails.getIn(['locationData', 'supplierInvoiceNumber', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'supplierInvoiceNumber', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'supplierInvoiceNumber', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'supplierInvoiceNumber').id;
      initialValues[`supplierInvoiceNumber-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'supplierInvoiceNumber').id;
      initialValues[`supplierInvoiceNumber-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'supplierInvoiceNumber').confidence;

      initialValues.referenceCode = props.invoiceDetails.getIn(['locationData', 'referenceCode', 'word'])
        ? Array(props.invoiceDetails.getIn(['locationData', 'referenceCode', 'word']).toString())
        : [];
      initialValues[`referenceCode-highlight`] = {};
      initialValues[`referenceCode-highlight`][
        props.invoiceDetails.getIn(['locationData', 'referenceCode', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'referenceCode', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'referenceCode', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'referenceCode').id;
      initialValues[`referenceCode-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'referenceCode').id;
      initialValues[`referenceCode-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'referenceCode').confidence;

      initialValues.invoiceDate = props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'word'])
        ? Array(props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'word']).toString())
        : [];
      initialValues[`invoiceDate-highlight`] = {};
      initialValues[`invoiceDate-highlight`][
        props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'word'])
          ? props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'word']).toString()
          : props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'word'])
      ] = state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === 'invoiceDate').id;
      initialValues[`invoiceDate-highlightId`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'invoiceDate').id;
      initialValues[`invoiceDate-confidence`] = state.highlights
        .filter(hl => hl.source === 'form')
        .find(hl => hl.key === 'invoiceDate').confidence;

      const locationData = props.invoiceDetails.get('locationData');
      Object.entries(additionalFieldKeys)
        .filter(
          ([afk, afv]) =>
            locationData.get(afk) &&
            Object.keys(afv).filter(afvk =>
              locationData
                .get(afk)
                .keySeq()
                .includes(afvk),
            ).length,
        )
        .forEach(([afk, afv]) => {
          Object.entries(afv)
            .filter(([field, label]) => locationData.getIn([afk, field]))
            .forEach(([field, label]) => {
              initialValues[`${afk}-${field}`] = locationData.getIn([afk, field, 'word'])
                ? Array(locationData.getIn([afk, field, 'word']))
                : [];
              initialValues[`${afk}-${field}-highlight`] = {};
              initialValues[`${afk}-${field}-highlight`][
                locationData.getIn([afk, field, 'word']).toString()
              ] = state.highlights.filter(hl => hl.source === 'additional').find(hl => hl.key === `${afk}-${field}`).id;
              initialValues[`${afk}-${field}-highlightId`] = state.highlights
                .filter(hl => hl.source === 'additional')
                .find(hl => hl.key === `${afk}-${field}`).id;
              initialValues[`${afk}-${field}-confidence`] = state.highlights
                .filter(hl => hl.source === 'additional')
                .find(hl => hl.key === `${afk}-${field}`).confidence;
            });
        });
      console.log('initial values', initialValues);
      return {
        tableData,
        tableDataIndex,
        tableDataPopulated: true,
        subUOMMap: tempMap,
        loadDataInState: false,
        selectedCurrency,
        currencySymbol,
        initialValues,
        disabledFields,
        pageLoader: false,
      };
    }
    return null;
  }

  async componentDidMount() {
    const id = this.props.pathname.split('/')[2];
    if (!this.props.invoiceDetails.size) {
      this.props.history.push(`/invoices/${id}/verify`);
    } else {
      await this.props.getActivePaymentTerms(GET_PT, STORE_PT);
      await this.props.getActiveTaxes();
      await this.props.getSuppliers({ registrationStatus: 'registered' });
      if (this.props.invoiceDetails.get('supplierId')) {
        await this.props.getSupplierDetails(this.props.invoiceDetails.get('supplierId'));
      }
      if (!this.props.isUomLoaded) await this.props.getUOMs();
      if (!this.props.isUomWithSubUomLoaded) await this.props.getUOMsWithSubUoms({ limit: 100, page: 1 });
      const highlights = [];
      const locationData = this.props.invoiceDetails.get('locationData');
      const tableItems = locationData.get('items').toArray();
      const formKeys = [
        'referenceCode',
        'supplierCompanyName',
        'supplierInvoiceNumber',
        'invoiceDate',
        'tax',
        'totalTaxes',
        'value',
        'subTotal',
      ];
      const tableKeys = ['lineItemTotal', 'name', 'price', 'quantity', 'taxPercent', 'uom'];
      formKeys.forEach(fk => {
        const locationObject = locationData.getIn([fk, 'polygon']);
        let location = {};
        if (locationObject) {
          location = {
            x1: locationObject.get('x1'),
            x2: locationObject.get('x2'),
            y1: locationObject.get('y1'),
            y2: locationObject.get('y2'),
          };
        }
        const highlightObject = {
          position: {
            boundingRect: {
              ...location,
              width: 1,
              height: 1,
            },
            rects: [
              {
                ...location,
                width: 1,
                height: 1,
              },
            ],
            pageNumber: locationData.getIn([fk, 'page']),
          },
          id: locationData.getIn([fk, 'cellId']),
          confidence: locationData.getIn([fk, 'confidence']),
          source: 'form',
          word: locationData.getIn([fk, 'word']),
          key: fk,
        };
        highlights.push(highlightObject);
      });

      tableItems.forEach((item, index) => {
        tableKeys.forEach(fk => {
          const locationObject = item.getIn([fk, 'polygon']);
          let location = {};
          if (locationObject) {
            location = {
              x1: locationObject.get('x1'),
              x2: locationObject.get('x2'),
              y1: locationObject.get('y1'),
              y2: locationObject.get('y2'),
            };
          }
          const highlightObject = {
            position: {
              boundingRect: {
                ...location,
                width: 1,
                height: 1,
              },
              rects: [
                {
                  ...location,
                  width: 1,
                  height: 1,
                },
              ],
              pageNumber: item.getIn([fk, 'page']),
            },
            id: item.getIn([fk, 'cellId']),
            confidence: item.getIn([fk, 'confidence']),
            source: 'table',
            lineItemId: item.get('lineItemId'),
            word: item.getIn([fk, 'word']),
            key: fk,
            rowIndex: index,
          };
          highlights.push(highlightObject);
        });
      });

      // const hypatosAdditionalDataMappings = this.getHypatosAdditionalDataMappings();
      Object.entries(additionalFieldKeys).forEach(([afk, afv]) => {
        const insideFieldKeys = Object.keys(afv);
        insideFieldKeys.forEach(fk => {
          // locationData.getIn([afk, fk])
          const locationObject = locationData.getIn([afk, fk, 'polygon']);
          let location = {};
          if (locationObject) {
            location = {
              x1: locationObject.get('x1'),
              x2: locationObject.get('x2'),
              y1: locationObject.get('y1'),
              y2: locationObject.get('y2'),
            };
          }
          const highlightObject = {
            position: {
              boundingRect: {
                ...location,
                width: 1,
                height: 1,
              },
              rects: [
                {
                  ...location,
                  width: 1,
                  height: 1,
                },
              ],
              pageNumber: locationData.getIn([afk, fk, 'page']),
            },
            id: locationData.getIn([afk, fk, 'cellId']),
            confidence: locationData.getIn([afk, fk, 'confidence']),
            source: 'additional',
            word: locationData.getIn([afk, fk, 'word']),
            key: `${afk}-${fk}`,
          };
          highlights.push(highlightObject);
        });
      });
      locationData
        .get('words')
        .toArray()
        .forEach(word => {
          const locationObject = word.get('polygon');
          let location = {};
          if (locationObject) {
            location = {
              x1: locationObject.get('x1'),
              x2: locationObject.get('x2'),
              y1: locationObject.get('y1'),
              y2: locationObject.get('y2'),
            };
          }
          const highlightObject = {
            position: {
              boundingRect: {
                ...location,
                width: 1,
                height: 1,
              },
              rects: [
                {
                  ...location,
                  width: 1,
                  height: 1,
                },
              ],
              pageNumber: word.get('page'),
            },
            id: word.get('cellId'),
            confidence: word.get('confidence'),
            source: 'word',
            word: word.get('word'),
          };
          highlights.push(highlightObject);
        });

      console.log('highlights cdm', highlights);
      this.setState({ pageLoader: false, highlights, loadDataInState: true });
      window.addEventListener('hashchange', this.scrollToHighlightFromHash, false);
    }
  }

  getHighlightById = id => this.state.newHighlights[id] || this.state.highlights.find(highlight => highlight.id === id);

  parseIdFromHash = () => document.location.hash.slice('#highlight-'.length);

  scrollViewerTo = () => {};

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(this.parseIdFromHash());
    if (highlight) {
      this.scrollViewerTo(highlight);
    }
  };

  resetHash = () => {
    document.location.hash = '';
  };

  updateHash = highlightId => {
    document.location.hash = `highlight-${highlightId}`;
  };

  findHighlightId = (key, source) => {
    const highlightObject = this.state.highlights.filter(hl => hl.source === source).find(hl => hl.key === key);
    return highlightObject.id;
  };

  updateHashForSelectedField = (key, e) => {
    if (e && this.state.selectedFields.key === key) {
      e.stopPropagation();
    }
    console.log('this.state.locationData', this.state.highlights);
    const highlightObject = this.state.highlights.filter(hl => hl.source === 'form').find(hl => hl.key === key);
    console.log('updateHashFunction', this.state.highlights.filter(hl => hl.source === 'form'), highlightObject);
    this.updateHash(highlightObject.id);
  };

  getWord = (key, source, row) => {
    let locationDataObjWithKey;
    const locationData = this.props.invoiceDetails.get('locationData');
    if (source === 'form') {
      locationDataObjWithKey = locationData.get(key);
    } else {
      locationDataObjWithKey = locationData
        .get('items')
        .toArray()
        [row].get(key);
    }
    return locationDataObjWithKey && locationDataObjWithKey.get('word');
  };

  updateHashForSelectedAdditionalField = highlightId => {
    this.updateHash(highlightId);
  };

  updateInitialValues = (val, field) => {
    console.log('olaa', val);
    const { initialValues } = this.state;
    initialValues[`${field}`] = val;
    // initialValues[`${field}-highlight`] = initialValues[`${field}-highlight`]
    // val.forEach(word => {
    //   if (!Object.keys(initialValues[`${field}-highlight`]).includes(word)) {
    //     delete initialValues[`${field}-highlight`][word];
    //   }
    // });
    Object.keys(initialValues[`${field}-highlight`]).forEach(word => {
      if (!val.includes(word)) {
        delete initialValues[`${field}-highlight`][word];
      }
    });
    const newBoundingRect = this.getConsolidatedHighlight(initialValues[`${field}-highlight`]);
    const { newHighlights, highlights } = this.state;
    const uuid = Object.values(newHighlights).find(hl => hl.key === field)
      ? Object.values(newHighlights).find(hl => hl.key === field).id
      : uuidv4();
    initialValues[`${field}-highlightId`] = uuid;
    const highlightObject = {
      position: {
        boundingRect: newBoundingRect,
        rects: [newBoundingRect],
        pageNumber: (
          Object.values(newHighlights).find(hl => hl.key === field) ||
          Object.values(highlights).find(hl => hl.key === field)
        ).position.pageNumber,
      },
      id: uuid,
      confidence: 0.7,
      source: 'new-highlight',
      word: val,
      key: field,
      rowIndex: this.state.selectedFields.row,
    };
    newHighlights[uuid] = highlightObject;
    initialValues[`${field}-confidence`] = 0.7;
    // this.props.form.setFieldsValue(setFieldValue);
    console.log('initial values', initialValues, newHighlights);
    this.setState({ initialValues, newHighlights });
    // this.setState({ initialValues });
  };

  renderAdditionalDataCards = () => {
    const { getFieldDecorator } = this.props.form;
    const locationData = this.props.invoiceDetails.get('locationData');
    return (
      <div>
        {Object.entries(additionalFieldKeys)
          .filter(
            ([afk, afv]) =>
              locationData.get(afk) &&
              Object.keys(afv).filter(afvk =>
                locationData
                  .get(afk)
                  .keySeq()
                  .includes(afvk),
              ).length,
          )
          .map(([afk, afv]) => (
            <Card
              title={additionalFieldsLabel[afk]}
              size="small"
              bordered={false}
              className="invoice-verify-additional-data-heading"
            >
              <DescriptionList size="small" layout="horizontal" col={1}>
                {Object.entries(afv)
                  .filter(([field, label]) => locationData.getIn([afk, field]))
                  .map(([field, label]) => (
                    <Description
                      key={field}
                      term={label}
                      // className="invoiceVerifyAdditionalData"
                      className={
                        this.state.selectedFields.key === `${afk}-${field}`
                          ? 'invoiceVerifyAdditionalData selected-field'
                          : 'invoiceVerifyAdditionalData onHover-highlight'
                      }
                      style={{ ...detailsStyle, width: '100%' }}
                      onClick={() => {
                        this.handleFieldSelection(`${afk}-${field}`, 'additional');
                        this.updateHashForSelectedAdditionalField(
                          this.state.initialValues[`${afk}-${field}-highlightId`],
                        );
                      }}
                    >
                      <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                        {getFieldDecorator(`${afk}-${field}`, {
                          initialValue: this.state.initialValues[`${afk}-${field}`],
                        })(
                          <Select
                            open={false}
                            mode="tags"
                            style={{ ...detailsStyle, width: '15vw' }}
                            placeholder="Enter Value"
                            value={this.state.initialValues[`${afk}-${field}`]}
                            onChange={val => this.updateInitialValues(val, `${afk}-${field}`)}
                            className={this.getConfidenceClassName(
                              '',
                              this.state.initialValues[`${afk}-${field}-confidence`],
                            )}
                          />,
                        )}
                      </Form.Item>
                    </Description>
                  ))}
              </DescriptionList>
            </Card>
          ))}
      </div>
    );
  };

  addTableDataItem = () => {
    let { tableData } = this.state;
    const { tableDataIndex } = this.state;
    tableData = tableData.set(tableDataIndex, {
      key: tableDataIndex,
      product: [],
      quantity: [],
      price: [],
      lineItemTotal: [],
      taxPercent: [],
      // selectedTaxIds: [],
      uom: [],
      // gst: 0,
    });
    this.setState({
      tableData,
      tableDataIndex: tableDataIndex + 1,
    });
  };

  updateTableData = (val, field, key, label) => {
    console.log('val', val, label);
    if (['hsn', 'quantity', 'price'].includes(field)) {
      let validate = true;
      val.forEach(v => {
        if (isNaN(v)) validate = false;
      });
      if (!validate) return errorMessage(`${field} must be a number`);
    }
    const { tableData } = this.state;
    if (field === 'uom' || field === 'taxPercent') {
      // tableData.get(key).uom = label;
      tableData.get(key)[field] = val.length ? Array(val[val.length - 1]) : [];
      tableData.get(key)[`${field}-confidence`] = 0.7;
      tableData.get(key).updated = true;
      // tableData.get(key)[`${field}-highlight`] = {};
      if (!val.length) {
        tableData.get(key)[`${field}-highlight`] = {};
      }
      const newBoundingRect = this.getConsolidatedHighlight(tableData.get(key)[`${field}-highlight`]);
      const { newHighlights } = this.state;
      const uuid = Object.values(newHighlights).find(hl => hl.key === field)
        ? Object.values(newHighlights).find(hl => hl.key === field).id
        : uuidv4();
      tableData.get(key)[`${field}-highlightId`] = uuid;
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: Object.values(newHighlights).find(hl => hl.key === field)
            ? Object.values(newHighlights).find(hl => hl.key === field).position.pageNumber
            : undefined,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: tableData.get(key)[field],
        key: field,
        rowIndex: key,
      };
      newHighlights[uuid] = highlightObject;
      this.setState({ tableData, newHighlights });
    } else {
      tableData.get(key)[field] = val;
      tableData.get(key)[`${field}-confidence`] = 0.7;
      tableData.get(key).updated = true;
      // tableData.get(key)[`${field}-highlight`] = {};
      console.log(
        'updateTableData 1',
        tableData.get(key)[`${field}-highlight`],
        Object.keys(tableData.get(key)[`${field}-highlight`]),
        val,
      );
      Object.keys(tableData.get(key)[`${field}-highlight`])
        .filter(keyWord => !val.includes(keyWord))
        .forEach(keyWord => {
          delete tableData.get(key)[`${field}-highlight`][keyWord];
        });
      console.log('updateTableData 2', tableData.get(key)[`${field}-highlight`]);
      const newBoundingRect = this.getConsolidatedHighlight(tableData.get(key)[`${field}-highlight`]);
      const { newHighlights } = this.state;
      const uuid = Object.values(newHighlights).find(hl => hl.key === field)
        ? Object.values(newHighlights).find(hl => hl.key === field).id
        : uuidv4();
      tableData.get(key)[`${field}-highlightId`] = uuid;
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: Object.values(newHighlights).find(hl => hl.key === field)
            ? Object.values(newHighlights).find(hl => hl.key === field).position.pageNumber
            : undefined,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: tableData.get(key)[field],
        key: field,
        rowIndex: key,
      };
      newHighlights[uuid] = highlightObject;
      this.setState({ tableData, newHighlights });
    }
  };

  updateTableDataTags = (val, field, key, highlightId, pgNo) => {
    console.log('updateTableDataTags', val, field, key, highlightId, pgNo);
    if (['hsn', 'quantity', 'price'].includes(field)) {
      if (isNaN(val)) return errorMessage(`${field} must be a number`);
    }
    const { tableData } = this.state;
    if (!tableData.get(key)[`${field}-highlight`]) {
      tableData.get(key)[`${field}-highlight`] = {};
    }
    if (field === 'uom' || field === 'taxPercent') {
      tableData.get(key)[`${field}-highlight`][val] = tableData.get(key)[field].includes(val)
        ? tableData.get(key)[`${field}-highlight`][val]
        : highlightId;
      tableData.get(key)[field] = val ? Array(val) : tableData.get(key)[field];
      // tableData.get(key)[`${field}-highlightId`] = tableData.get(key)[field].includes(val)
      //   ? tableData.get(key)[`${field}-highlightId`]
      //   : highlightId;
      tableData.get(key)[`${field}-confidence`] = tableData.get(key)[field].includes(val)
        ? tableData.get(key)[`${field}-confidence`]
        : 0.7;
      tableData.get(key).updated = true;
      console.log('bounding highlight', tableData.get(key)[`${field}-highlight`]);
      const newBoundingRect = this.getConsolidatedHighlight(tableData.get(key)[`${field}-highlight`]);
      const { newHighlights } = this.state;
      const uuid = Object.values(newHighlights).find(hl => hl.key === field)
        ? Object.values(newHighlights).find(hl => hl.key === field).id
        : uuidv4();
      tableData.get(key)[`${field}-highlightId`] = uuid;
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: pgNo || Object.values(newHighlights).find(hl => hl.key === field).position.pageNumber,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: tableData.get(key)[field],
        key: field,
        rowIndex: key,
      };
      newHighlights[uuid] = highlightObject;
      this.setState({ tableData, newHighlights });
    } else {
      tableData.get(key)[`${field}-highlight`][val] = tableData.get(key)[field].includes(val)
        ? tableData.get(key)[`${field}-highlight`][val]
        : highlightId;
      tableData.get(key)[field] = tableData.get(key)[field].includes(val)
        ? tableData.get(key)[field]
        : [...tableData.get(key)[field], val];
      // tableData.get(key)[`${field}-highlightId`] = tableData.get(key)[field].includes(val)
      //   ? tableData.get(key)[`${field}-highlightId`]
      //   : highlightId;
      tableData.get(key)[`${field}-confidence`] = tableData.get(key)[field].includes(val)
        ? tableData.get(key)[`${field}-confidence`]
        : 0.7;
      console.log('bounding highlight', tableData.get(key)[`${field}-highlight`]);
      const newBoundingRect = this.getConsolidatedHighlight(tableData.get(key)[`${field}-highlight`]);
      const { newHighlights } = this.state;
      const uuid = Object.values(newHighlights).find(hl => hl.key === field)
        ? Object.values(newHighlights).find(hl => hl.key === field).id
        : uuidv4();
      tableData.get(key)[`${field}-highlightId`] = uuid;
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: pgNo || Object.values(newHighlights).find(hl => hl.key === field).position.pageNumber,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: tableData.get(key)[field],
        key: field,
        rowIndex: key,
      };
      newHighlights[uuid] = highlightObject;
      tableData.get(key).updated = true;
      this.setState({ tableData, newHighlights });
    }
  };

  submitInvoiceForm = method => {
    let nullValueIndex = false;
    let taxAvailable = true;
    let uomPresent = true;
    const preferredTaxes = this.props.invoiceDetails.getIn(['meta', 'preferredTaxes', 'taxRates']).toArray();
    console.log(this.state.tableData.toJS());
    this.state.tableData
      .valueSeq()
      .toArray()
      .filter(item => !item.deleted)
      .forEach(item => {
        if (
          !item.price.length ||
          !item.quantity.length ||
          !item.product.length ||
          !item.lineItemTotal.length ||
          !item.uom.length ||
          !item.price.length
        ) {
          nullValueIndex = true;
        }
        uomPresent = uomPresent && item.uom[0] && this.props.uoms.map(i => i.get('unit')).includes(item.uom[0]);
        console.log(
          'taxes',
          preferredTaxes,
          item.taxPercent[0],
          taxAvailable,
          preferredTaxes.includes(item.taxPercent[0]),
        );
        const taxValue = item.taxPercent[0] ? item.taxPercent[0].replace(/^[^a-z\d]|[^a-z\d]$/gi, '').trim() : null;
        console.log('taxValue', `[${taxValue}]`);
        taxAvailable = taxAvailable && taxValue && !isNaN(taxValue) && preferredTaxes.includes(+taxValue);
      });
    if (method === 'SUBMIT' && !uomPresent) {
      return errorMessage('Entered Uom is not defined');
    }
    if (method === 'SUBMIT' && !taxAvailable) {
      return errorMessage('Entered tax percent is not available');
    }
    if (nullValueIndex && method === 'SUBMIT') {
      errorMessage(' enter valid details in product, quantity, price, line item total and uom');
      return;
    }
    if (method === 'SUBMIT') {
      this.props.form.validateFields((err, values) => {
        if (err) {
          Object.values(err).forEach(e => errorMessage(e.errors[0].message));
        }
        if (!err) {
          return null;
        }
      });
    }
    const invoiceDate = this.props.form.getFieldValue('invoiceDate')
      ? this.props.form.getFieldValue('invoiceDate').join(' ')
      : null;
    const paymentTerms =
      this.props.form.getFieldValue('paymentTerms') &&
      this.props.paymentTerms
        .find(i => this.props.form.getFieldValue('paymentTerms') === i.get('key'))
        .get('details')
        .toJS();
    const { selectedCurrency } = this.state;
    const currency = selectedCurrency.get(this.props.form.getFieldValue('allowedCurrency'));
    const json = {
      method,
      senderInformation: {},
      paymentInformation: {},
      customerInformation: {},
      otherInformation: {},
      invoiceDate: {},
      referenceCode: {},
      supplierInvoiceNumber: {},
      value: {},
      items: [],
      supplierId: this.props.form.getFieldValue('supplier'),
      baseCurrencyId: this.props.baseCurrency.get('id'),
      currencyId: this.props.form.getFieldValue('allowedCurrency'),
      exchangeCalculatedBy: currency && currency.conversionType,
      transactionCurrencyExchangeRate: currency && currency.exchangeRate,
      currencyExchangeDate: moment().format('YYYY-MM-DD'),
      paymentTerms,
    };
    json.invoiceDate = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['invoiceDate-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['invoiceDate-highlightId'])
          : this.state.newHighlights[this.state.initialValues['invoiceDate-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: invoiceDate,
      confidence: this.state.initialValues['invoiceDate-confidence'],
    };
    json.referenceCode = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['referenceCode-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['referenceCode-highlightId'])
          : this.state.newHighlights[this.state.initialValues['referenceCode-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: this.props.form.getFieldValue('referenceCode')
        ? this.props.form.getFieldValue('referenceCode').join(' ')
        : null,
      confidence: this.state.initialValues['referenceCode-confidence'],
    };
    json.supplierInvoiceNumber = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['supplierInvoiceNumber-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['supplierInvoiceNumber-highlightId'])
          : this.state.newHighlights[this.state.initialValues['supplierInvoiceNumber-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: this.props.form.getFieldValue('invoiceNumber')
        ? this.props.form.getFieldValue('invoiceNumber').join(' ')
        : null,
      confidence: this.state.initialValues['supplierInvoiceNumber-confidence'],
    };
    json.subTotal = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['subTotal-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['subTotal-highlightId'])
          : this.state.newHighlights[this.state.initialValues['subTotal-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: this.props.form.getFieldValue('subTotal') ? this.props.form.getFieldValue('subTotal').join('') : null,
      confidence: this.state.initialValues['subTotal-confidence'],
    };
    json.totalTaxes = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['totalTaxes-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['totalTaxes-highlightId'])
          : this.state.newHighlights[this.state.initialValues['totalTaxes-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: this.props.form.getFieldValue('totalTaxes') ? this.props.form.getFieldValue('totalTaxes').join('') : null,
      confidence: this.state.initialValues['totalTaxes-confidence'],
    };
    json.value = {
      polygon: {
        ...(this.state.highlights.find(hl => hl.id === this.state.initialValues['value-highlightId'])
          ? this.state.highlights.find(hl => hl.id === this.state.initialValues['value-highlightId'])
          : this.state.newHighlights[this.state.initialValues['value-highlightId']]
        ).position.boundingRect,
        height: undefined,
        width: undefined,
      },
      word: this.props.form.getFieldValue('value') ? this.props.form.getFieldValue('value').join('') : null,
      confidence: this.state.initialValues['value-confidence'],
    };
    Object.entries(additionalFieldKeys).forEach(([afk, afv]) => {
      json[afk] = {};
      Object.entries(afv).forEach(([field, fv]) => {
        json[afk][field] = {
          polygon: {
            ...(this.state.highlights.find(hl => hl.id === this.state.initialValues[`${afk}-${field}-highlightId`])
              ? this.state.highlights.find(hl => hl.id === this.state.initialValues[`${afk}-${field}-highlightId`])
              : this.state.newHighlights[this.state.initialValues[`${afk}-${field}-highlightId`]]
            ).position.boundingRect,
            height: undefined,
            width: undefined,
          },
          word: this.props.form.getFieldValue(`${afk}-${field}`)
            ? this.props.form.getFieldValue(`${afk}-${field}`).join(' ')
            : null,
          confidence: this.state.initialValues[`${afk}-${field}-confidence`],
        };
      });
    });
    json.items = [];
    console.log(
      'highlights: ',
      this.state.highlights,
      'new highlights: ',
      this.state.newHighlights,
      'table data: ',
      this.state.tableData.toJS(),
    );
    this.state.tableData
      .valueSeq()
      .filter(item => !item.deleted || item.id)
      .forEach((row, rowIndex) => {
        json.items[rowIndex] = {
          lineItemId: this.props.invoiceDetails.getIn(['locationData', 'items']).toArray()[rowIndex]
            ? this.props.invoiceDetails
                .getIn(['locationData', 'items'])
                .toArray()
                [rowIndex].get('lineItemId')
            : undefined,
          name: {
            polygon: row['product-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['product-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['product-highlightId'])
                    : this.state.newHighlights[row['product-highlightId']] || {
                    position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                  }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.product ? row.product.join('') : '',
            confidence: row['product-confidence'],
          },
          quantity: {
            polygon: row['quantity-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['quantity-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['quantity-highlightId'])
                    : this.state.newHighlights[row['quantity-highlightId']] || {
                      position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                    }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.quantity ? row.quantity.join('') : undefined,
            confidence: row['quantity-confidence'],
          },
          price: {
            polygon: row['price-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['price-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['price-highlightId'])
                    : this.state.newHighlights[row['price-highlightId']] || {
                      position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                    }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.price ? row.price.join('') : undefined,
            confidence: row['price-confidence'],
          },
          lineItemTotal: {
            polygon: row['lineItemTotal-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['lineItemTotal-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['lineItemTotal-highlightId'])
                    : this.state.newHighlights[row['lineItemTotal-highlightId']] || {
                      position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                    }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.lineItemTotal ? row.lineItemTotal.join('') : undefined,
            confidence: row['lineItemTotal-confidence'],
          },
          uom: {
            polygon: row['uom-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['uom-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['uom-highlightId'])
                    : this.state.newHighlights[row['uom-highlightId']] || {
                      position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                    }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.uom[0] ? row.uom[0].toString() : null,
            confidence: row['uom-confidence'],
          },
          taxPercent: {
            polygon: row['taxPercent-highlightId']
              ? {
                  ...(this.state.highlights.find(hl => hl.id === row['taxPercent-highlightId'])
                    ? this.state.highlights.find(hl => hl.id === row['taxPercent-highlightId'])
                    : this.state.newHighlights[row['taxPercent-highlightId']] || {
                      position: { boundingRect: { x1: 0, x2: 0, y1: 0, y2: 0, width: 1, height: 1 } },
                    }
                  ).position.boundingRect,
                  height: undefined,
                  width: undefined,
                }
              : {},
            word: row.taxPercent[0]
              ? row.taxPercent[0].replace(/^[^a-z\d]|[^a-z\d]$/gi, '').trim()
              : // .toString()
              null,
            confidence: row['taxPercent-confidence'],
          },
          method: row.deleted ? 'DELETE' : row.updated && row.id ? 'UPDATE' : 'SUBMIT',
        };
      });
    // return console.log('payload', json);
    this.props.amendOCRInvoice(
      this.props.invoiceDetails.get('id'),
      json,
      this.props.history,
      this.props.invoiceDetails.get('type'),
    )
    // return console.log('payload', json);
  };

  getSuppliersBySearchDebounce = debounce(this.props.getSuppliers, 500);

  handleSupplierSearch = value => {
    this.getSuppliersBySearchDebounce({
      nameQuery: value,
      limit: 10,
      registrationStatus: 'registered',
    });
  };

  handleSupplierSelection = async supplierId => {
    await this.props.getSupplierDetails(supplierId);
    const { initialValues } = this.state;
    const baseCurrencyId = this.props.baseCurrency.get('id');
    if (this.props.supplierDetails.get('SCMs').size === 1) {
      const data = this.props.supplierDetails.getIn(['SCMs', 0]);
      const isCurrencyDisable = baseCurrencyId === data.get('currencyId');
      initialValues.allowedCurrency = data.get('currencyId');
      this.addCurrency(data.get('Currency').toJS(), isCurrencyDisable);
      this.setState({
        initialValues,
        disabledFields: { allowedCurrency: true },
      });
    } else {
      initialValues.allowedCurrency = undefined;
      this.setState({
        initialValues,
        disabledFields: { allowedCurrency: false },
      });
    }
  };

  addCurrency = (currency, isCurrencyDisable) => {
    let selectedCurrency = Map();
    selectedCurrency = selectedCurrency.set(currency.id, {
      currencyName: currency.name,
      exchangeRate: currency.exchangeRate,
      conversionType: currency.conversionType,
      symbol: currency.symbol,
      isCurrencyDisable,
      currencyId: currency.id,
    });
    this.setState({
      selectedCurrency,
      currencySymbol: currency.symbol,
    });
  };

  handleCurrencySelect = val => {
    const isCurrencyDisable = val === this.props.baseCurrency.get('id');
    const data = this.props.supplierDetails.get('SCMs').find(item => item.get('currencyId') === val);
    this.addCurrency(data.get('Currency').toJS(), isCurrencyDisable);
  };

  renderPopOver = () => {
    const { selectedCurrency } = this.state;
    const data = selectedCurrency.get(this.props.form.getFieldValue('allowedCurrency'));

    if (data) {
      return (
        <>
          <span>Currency: {data.currencyName}</span>
          <span>symbol: {data.symbol}</span>
          <span>Exchange Rate: ₹ {data.exchangeRate}</span>
          <span>Conversion Type: {data.conversionType}</span>
        </>
      );
    }

    return <div>No Currency Selected</div>;
  };

  updateCurrencyItem = (value, columnName, key) => {
    const currency = this.state.selectedCurrency.get(key);
    currency[columnName] = value;
    const selectedCurrency = this.state.selectedCurrency.set(key, currency);
    this.setState({
      selectedCurrency,
    });
  };

  handleFieldSelection = (key, type, row) => {
    const { selectedFields } = this.state;
    if (selectedFields.key === key && (row && selectedFields.row ? selectedFields.row === row : true)) {
      selectedFields.key = undefined;
      selectedFields.type = undefined;
      selectedFields.row = undefined;
    } else {
      selectedFields.key = key;
      selectedFields.type = type;
      selectedFields.row = row;
    }
    console.log('selectedFields', selectedFields);
    this.setState({ selectedFields });
  };

  deleteTableItem = record => {
    let { tableData } = this.state;
    if (record.id) {
      const tableItem = tableData.get(record.key);
      tableItem.deleted = true;
      tableItem.updated = true;
      tableData = tableData.set(record.key, tableItem);
    } else {
      tableData = tableData.delete(record.key);
    }
    this.setState({ tableData });
  };

  undoTableItemDelete = key => {
    let { tableData } = this.state;
    const tableItem = tableData.get(key);
    tableItem.deleted = false;
    tableItem.updated = true;
    tableData = tableData.set(key, tableItem);
    this.setState({ tableData });
  };

  getConfidenceClassName = (classes, score) => {
    if (!score && score !== 0) {
      return classes;
    }
    if (score >= 0.5) {
      return classes ? `${classes} green-confidence` : 'green-confidence';
    }
    if (score >= 0.1) {
      return classes ? `${classes} orange-confidence` : 'orange-confidence';
    }
    return classes ? `${classes} red-confidence` : 'red-confidence';
  };

  renderUpdateCard = () => {
    const { invoiceDetails } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const symbol = invoiceDetails.getIn(['Currency', 'symbol']);
    const pdfColumns = [
      {
        title: 'Product',
        dataIndex: 'product',
        key: 'product',
        width: '40%',
        ellipsis: true,
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('product', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'product' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'product' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].product.id);
                this.updateHash(record['product-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName(
                  'update-table-select product-field',
                  record['product-confidence'],
                )}
                mode="tags"
                value={text}
                placeholder="Item name"
                onChange={e => this.updateTableData(e, 'product', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity',
        className: 'center-align',
        width: '10%',
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('quantity', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'quantity' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'quantity' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].quantity.id);
                this.updateHash(record['quantity-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName('update-table-select', record['quantity-confidence'])}
                mode="tags"
                value={text}
                placeholder="Qty"
                onChange={e => this.updateTableData(e, 'quantity', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: (
          <span>
            Unit&ensp;
            <Popover
              title="Available UOMs"
              content={
                <div className="scroll-popover">
                  {this.props.uoms.map(item => (
                    <div>{item.get('unit')}</div>
                  ))}
                </div>
              }
            >
              <InfoCircleTwoTone />
            </Popover>
          </span>
        ),
        dataIndex: 'uom',
        key: 'uom',
        width: '10%',
        className: 'center-align',
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('uom', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'uom' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'uom' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].uom.id);
                this.updateHash(record['uom-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName('update-table-select', record['uom-confidence'])}
                mode="tags"
                value={text}
                placeholder="Uom"
                onChange={e => this.updateTableData(e, 'uom', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        className: 'center-align',
        width: '10%',
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('price', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'price' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'price' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].price.id);
                this.updateHash(record['price-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName('update-table-select', record['price-confidence'])}
                mode="tags"
                value={text}
                placeholder="Price"
                onChange={e => this.updateTableData(e, 'price', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: (
          <span>
            Tax %&ensp;
            <Popover
              title={
                <span>Preferred Tax - {this.props.invoiceDetails.getIn(['meta', 'preferredTaxes', 'taxGroup'])}</span>
              }
              content={
                <div className="scroll-popover">
                  {this.props.invoiceDetails.getIn(['meta', 'preferredTaxes', 'taxRates']).map(item => (
                    <div>{item} %</div>
                  ))}
                </div>
              }
            >
              <InfoCircleTwoTone />
            </Popover>
          </span>
        ),
        dataIndex: 'taxPercent',
        key: 'taxPercent',
        className: 'center-align',
        width: '10%',
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('taxPercent', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'taxPercent' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'taxPercent' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].taxPercent.id);
                this.updateHash(record['taxPercent-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName('update-table-select', record['taxPercent-confidence'])}
                mode="tags"
                value={text}
                placeholder="Taxes"
                onChange={e => this.updateTableData(e, 'taxPercent', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: 'Total',
        dataIndex: 'lineItemTotal',
        key: 'lineItemTotal',
        className: 'center-align',
        width: '10%',
        onCell: (record, rowIndex) => ({
          onClick: e => {
            if (!record.deleted) {
              this.handleFieldSelection('lineItemTotal', 'table', record.key);
            }
          },
        }),
        render: (text, record) => ({
          props:
            this.state.selectedFields.key === 'lineItemTotal' && this.state.selectedFields.row === record.key
              ? {
                  // style: { backgroundColor: 'moccasin' },
                  className: 'selected-field',
                }
              : {},
          children: (
            <span
              onClick={e => {
                if (this.state.selectedFields.key === 'lineItemTotal' && this.state.selectedFields.row === record.key) {
                  e.stopPropagation();
                }
                // this.updateHash(this.state.tableLocationData[record.index].lineItemTotal.id);
                this.updateHash(record['lineItemTotal-highlightId']);
              }}
            >
              <Select
                open={false}
                className={this.getConfidenceClassName('update-table-select', record['lineItemTotal-confidence'])}
                mode="tags"
                value={text}
                placeholder="Item total"
                onChange={e => this.updateTableData(e, 'lineItemTotal', record.key)}
                disabled={record.deleted}
              />
            </span>
          ),
        }),
      },
      {
        title: <SettingTwoTone />,
        dataIndex: 'actions',
        key: 'actions',
        className: 'center-align',
        width: '10%',
        render: (text, record) => {
          if (!record.deleted) {
            return (
              <Tooltip title="Delete">
                <DeleteOutlined onClick={() => this.deleteTableItem(record)} style={{ color: 'red' }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Undo Delete">
              <UndoOutlined onClick={() => this.undoTableItemDelete(record.key)} style={{ color: 'green' }} />
            </Tooltip>
          );
        },
      },
    ];

    const pdfRows = this.state.tableData
      .valueSeq()
      .toArray()
      .map(line => ({
        key: line.key,
        id: line.id,
        index: line.index,
        product: line.product,
        'product-highlight': line['product-highlight'],
        'product-highlightId': line['product-highlightId'],
        'product-confidence': line['product-confidence'],
        quantity: line.quantity,
        'quantity-highlight': line['quantity-highlight'],
        'quantity-highlightId': line['quantity-highlightId'],
        'quantity-confidence': line['quantity-confidence'],
        price: line.price,
        'price-highlight': line['price-highlight'],
        'price-highlightId': line['price-highlightId'],
        'price-confidence': line['price-confidence'],
        hsn: line.hsn,
        taxPercent: line.taxPercent,
        'taxPercent-highlight': line['taxPercent-highlight'],
        'taxPercent-highlightId': line['taxPercent-highlightId'],
        'taxPercent-confidence': line['taxPercent-confidence'],
        selectedTaxIds: line.selectedTaxIds,
        uom: line.uom,
        'uom-highlight': line['uom-highlight'],
        'uom-highlightId': line['uom-highlightId'],
        'uom-confidence': line['uom-confidence'],
        isNonStockItem: line.isNonStockItem,
        lineItemTotal: line.lineItemTotal,
        'lineItemTotal-highlight': line['lineItemTotal-highlight'],
        'lineItemTotal-highlightId': line['lineItemTotal-highlightId'],
        'lineItemTotal-confidence': line['lineItemTotal-confidence'],
        deleted: line.deleted,
      }));
    return (
      <Card
        className="invoice-verify-editable-card"
        bordered={false}
        style={{ display: 'flex', flex: 49, overflowY: 'scroll', height: '90vh' }}
      >
        <Form>
          <DescriptionList size="small" layout="horizontal" col={1}>
            <Description
              key="Supplier"
              term="Supplier"
              className="invoiceVerifyUpdate"
              style={{ ...detailsStyle, width: '100%' }}
              onClick={() => this.updateHashForSelectedField('supplierCompanyName')}
              // onClick={() => this.updateHashForSelectedField(this.state.initialValues[`supplier`])}
            >
              <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                {getFieldDecorator('supplier', {
                  rules: [
                    {
                      required: true,
                      message: 'supplier is required',
                    },
                  ],
                  initialValue: this.state.initialValues.supplier ? this.state.initialValues.supplier : undefined,
                })(
                  <Select
                    showSearch
                    placeholder="Search for suppliers"
                    notFoundContent={this.props.supplierSearchLoader ? <Spin size="small" /> : null}
                    filterOption={false}
                    onSearch={value => this.handleSupplierSearch(value)}
                    onChange={value => this.handleSupplierSelection(value)}
                    disabled={this.state.disabledFields.supplier}
                    allowClear
                    dropdownMatchSelectWidth={false}
                    style={selectStyle}
                  >
                    {this.props.supplierSearchResults.map(supplier => (
                      <Option value={supplier.get('id')}>{supplier.get('name')}</Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
            </Description>
            {getFieldValue('supplier') && (
              <Description
                key="currency"
                term="Currency"
                className="invoiceVerifyUpdate"
                style={{ ...detailsStyle, width: '100%' }}
              >
                <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center' }}>
                    {getFieldDecorator('allowedCurrency', {
                      rules: [formRequiredRule('Allowed Currency is mandatory!')],
                      initialValue: this.state.initialValues.allowedCurrency || undefined,
                    })(
                      <Select
                        placeholder="Select Allowed Currency"
                        onChange={val => this.handleCurrencySelect(val)}
                        disabled={this.state.disabledFields.allowedCurrency}
                        allowClear
                        dropdownMatchSelectWidth={false}
                        style={{ width: '90%', flex: 12 }}
                      >
                        {this.props.supplierDetails &&
                          this.props.supplierDetails
                            .get('SCMs')
                            .map(c => (
                              <Option key={c.get('currencyId')} value={c.get('currencyId')}>{`${c.getIn([
                                'Currency',
                                'code',
                              ])} - ${c.getIn(['Currency', 'name'])}`}</Option>
                            ))}
                      </Select>,
                    )}
                    <div style={{ display: 'flex', flex: 3 }}>
                      <Popover
                        content={<div style={{ display: 'flex', flexDirection: 'column' }}>{this.renderPopOver()}</div>}
                      >
                        <SettingTwoTone
                          style={{
                            marginLeft: '8px',
                            cursor: this.state.disabledFields.allowedCurrency ? 'not-allowed' : 'pointer',
                          }}
                          onClick={() =>
                            this.state.disabledFields.allowedCurrency
                              ? null
                              : this.setState({
                                openCurrencySelectModal: true,
                                })
                          }
                        />
                      </Popover>
                    </div>
                  </div>
                </Form.Item>
              </Description>
            )}
            <Description
              key="paymentTerms"
              term={
                <span style={{ marginBottom: 0 }}>
                  Payment Terms{' '}
                  {getFieldValue('paymentTerms') === 'Custom' && (
                    <a onClick={() => this.setState({ displayPaymentTermsModal: true })}>Edit</a>
                  )}
                </span>
              }
              className="invoiceVerifyUpdate"
              style={{ ...detailsStyle, width: '100%' }}
            >
              <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                {getFieldDecorator('paymentTerms', {
                  rules: [formRequiredRule('Payment Terms are mandatory')],
                  initialValue: this.props.invoiceDetails.getIn(['Supplier', 'paymentTerms', 'key']),
                  onChange: value => {
                    if (value === 'Custom') {
                      this.setState({ displayPaymentTermsModal: true });
                    }
                  },
                })(
                  <Select placeholder="Select Payment Terms" dropdownMatchSelectWidth={false} style={selectStyle}>
                    {this.props.paymentTerms.map(item => (
                      <Option value={item.get('key')}>
                        <PaymentTermsPopover paymentTerms={item.get('details')} />{' '}
                      </Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
            </Description>

            <Description
              key="PO Number"
              term="PO Number"
              className={
                this.state.selectedFields.key === 'referenceCode'
                  ? 'invoiceVerifyUpdate selected-field'
                  : 'invoiceVerifyUpdate onHover-highlight'
              }
              style={{ ...detailsStyle, width: '100%' }}
              onClick={() => {
                this.handleFieldSelection('referenceCode', 'form');
                this.updateHash(this.state.initialValues[`referenceCode-highlightId`]);
              }}
            >
              <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                {getFieldDecorator('referenceCode', {
                  initialValue: this.state.initialValues.referenceCode,
                })(
                  <Select
                    open={false}
                    mode="tags"
                    style={{ ...detailsStyle, width: '15vw' }}
                    placeholder="PO Number"
                    onChange={val => this.updateInitialValues(val, 'referenceCode')}
                    value={this.state.initialValues.referenceCode}
                    className={this.getConfidenceClassName('', this.state.initialValues['referenceCode-confidence'])}
                  />,
                )}
              </Form.Item>
            </Description>
            <Description
              key="Invoice Number"
              term="Invoice Number"
              className={
                this.state.selectedFields.key === 'supplierInvoiceNumber'
                  ? 'invoiceVerifyUpdate selected-field'
                  : 'invoiceVerifyUpdate onHover-highlight'
              }
              style={{ ...detailsStyle, width: '100%' }}
              onClick={() => {
                this.handleFieldSelection('supplierInvoiceNumber', 'form');
                this.updateHash(this.state.initialValues[`supplierInvoiceNumber-highlightId`]);
              }}
            >
              {console.log(
                'field value',
                this.props.form.getFieldValue('invoiceNumber'),
                this.state.initialValues.supplierInvoiceNumber,
              )}
              <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                {getFieldDecorator('invoiceNumber', {
                  rules: [formRequiredRule('Invoice Number is mandatory')],
                  initialValue: this.state.initialValues.supplierInvoiceNumber,
                })(
                  <Select
                    open={false}
                    mode="tags"
                    style={{ ...detailsStyle, width: '15vw' }}
                    placeholder="Invoice Number"
                    onChange={val => this.updateInitialValues(val, 'supplierInvoiceNumber')}
                    value={this.state.initialValues.supplierInvoiceNumber}
                    className={this.getConfidenceClassName(
                      '',
                      this.state.initialValues['supplierInvoiceNumber-confidence'],
                    )}
                  />,
                )}
              </Form.Item>
            </Description>
            <Description
              key="Purchaser"
              term="Purchaser"
              className="invoiceVerifyUpdate"
              style={{ ...detailsStyle, width: '100%' }}
            >
              {this.props.invoiceDetails.getIn(['User', 'name'])}
            </Description>
            {this.props.invoiceDetails.getIn(['PO', 'poDate']) && (
              <Description
                key="PO Date"
                term="PO Date"
                className="invoiceVerifyUpdate"
                style={{ ...detailsStyle, width: '100%' }}
              >
                {getUTCForInvoiceExtraction(this.props.invoiceDetails.getIn(['PO', 'poDate']))}
              </Description>
            )}
            <Description
              key="Invoice Date"
              term="Invoice Date (YYYY-MM-DD)"
              className={
                this.state.selectedFields.key === 'invoiceDate'
                  ? 'invoiceVerifyUpdate selected-field'
                  : 'invoiceVerifyUpdate onHover-highlight'
              }
              style={{ ...detailsStyle, width: '100%' }}
              onClick={() => {
                this.handleFieldSelection('invoiceDate', 'form');
                this.updateHash(this.state.initialValues[`invoiceDate-highlightId`]);
              }}
            >
              <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                {getFieldDecorator('invoiceDate', {
                  // rules: [formRequiredRule('Invoice Date is mandatory')],
                  initialValue: this.state.initialValues.invoiceDate,
                  onClick: e => this.updateHashForSelectedField('supplierInvoiceReference', e),
                })(
                  <Select
                    open={false}
                    mode="tags"
                    style={{ ...detailsStyle, width: '15vw' }}
                    placeholder="Invoice Date"
                    onChange={val => this.updateInitialValues(val, 'invoiceDate')}
                    value={this.state.initialValues.invoiceDate}
                    className={this.getConfidenceClassName('', this.state.initialValues['invoiceDate-confidence'])}
                  />,
                )}
              </Form.Item>
            </Description>
          </DescriptionList>
          <Row>
            <Table
              tableLayout="auto"
              size="medium"
              scroll={{ x: true, y: 0 }}
              style={{ marginTop: '30px' }}
              bordered
              columns={pdfColumns}
              dataSource={pdfRows}
              pagination={false}
              className="invoice-verify-table edit"
            />
            <div>
              <Button icon={<PlusOutlined />} type="dashed" onClick={() => this.addTableDataItem()}>
                Add item
              </Button>
            </div>
          </Row>
          <Row style={{ marginTop: '10px' }}>
            <Col span={13} offset={11}>
              <DescriptionList
                size="small"
                layout="horizontal"
                style={{ textAlign: 'right', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                col={1}
              >
                <Description
                  key="Sub Total"
                  term="Sub Total"
                  className={
                    this.state.selectedFields.key === 'subTotal'
                      ? 'invoiceVerifyUpdate selected-field'
                      : 'invoiceVerifyUpdate onHover-highlight'
                  }
                  style={{ ...detailsStyle, width: '100%' }}
                  onClick={() => {
                    this.handleFieldSelection('subTotal', 'form');
                    this.updateHash(this.state.initialValues[`subTotal-highlightId`]);
                  }}
                >
                  <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                    {getFieldDecorator('subTotal', {
                      rules: [formRequiredRule('Subtotal is mandatory')],
                      initialValue: this.state.initialValues.subTotal,
                    })(
                      <Select
                        open={false}
                        mode="tags"
                        style={{ ...detailsStyle, width: '10vw' }}
                        placeholder="Subtotal"
                        onChange={val => this.updateInitialValues(val, 'subTotal')}
                        value={this.state.initialValues.subTotal}
                        className={this.getConfidenceClassName('', this.state.initialValues['subTotal-confidence'])}
                      />,
                    )}
                  </Form.Item>
                </Description>
                <Description
                  key="Tax Value"
                  term="Tax Value"
                  className={
                    this.state.selectedFields.key === 'totalTaxes'
                      ? 'invoiceVerifyUpdate selected-field'
                      : 'invoiceVerifyUpdate onHover-highlight'
                  }
                  style={{ ...detailsStyle, width: '100%' }}
                  onClick={() => {
                    this.handleFieldSelection('totalTaxes', 'form');
                    this.updateHash(this.state.initialValues[`totalTaxes-highlightId`]);
                  }}
                >
                  <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                    {getFieldDecorator('totalTaxes', {
                      rules: [formRequiredRule('Total taxes is mandatory')],
                      initialValue: this.state.initialValues.totalTaxes,
                    })(
                      <Select
                        open={false}
                        mode="tags"
                        style={{ ...detailsStyle, width: '10vw' }}
                        placeholder="Total taxes"
                        onChange={val => this.updateInitialValues(val, 'totalTaxes')}
                        value={this.state.initialValues.totalTaxes}
                        className={this.getConfidenceClassName('', this.state.initialValues['taxTotal-confidence'])}
                      />,
                    )}
                  </Form.Item>
                </Description>
                <Description
                  key="Invoice Value"
                  term="Invoice Value"
                  className={
                    this.state.selectedFields.key === 'value'
                      ? 'invoiceVerifyUpdate selected-field'
                      : 'invoiceVerifyUpdate onHover-highlight'
                  }
                  style={{ ...detailsStyle, width: '100%' }}
                  onClick={() => {
                    this.handleFieldSelection('value', 'form');
                    this.updateHash(this.state.initialValues[`value--highlightId`]);
                  }}
                >
                  <Form.Item style={formItemStyle} className="invoice-verify-form-item">
                    {getFieldDecorator('value', {
                      rules: [formRequiredRule('Value is mandatory')],
                      initialValue: this.state.initialValues.value,
                    })(
                      <Select
                        open={false}
                        mode="tags"
                        style={{ ...detailsStyle, width: '10vw' }}
                        placeholder="Value"
                        onChange={val => this.updateInitialValues(val, 'value')}
                        value={this.state.initialValues.value}
                        className={this.getConfidenceClassName('', this.state.initialValues['value-confidence'])}
                      />,
                    )}
                  </Form.Item>
                </Description>
              </DescriptionList>
            </Col>
          </Row>
          <br />
          {this.renderAdditionalDataCards('update')}
        </Form>
      </Card>
    );
  };

  getConsolidatedHighlight = highlightIds => {
    console.log('highlightIds', highlightIds);
    const highlightIdArray = Object.values(highlightIds);
    const highlightObjectArray = [];
    highlightIdArray.forEach(id => {
      console.log('id', id, this.state.newHighlights);
      highlightObjectArray.push(this.state.highlights.find(hl => hl.id === id) || this.state.newHighlights[id]);
    });
    console.log('highlightObjectArray', highlightObjectArray);
    const x1Array = highlightObjectArray.map(hl => hl.position.boundingRect.x1);
    const x2Array = highlightObjectArray.map(hl => hl.position.boundingRect.x2);
    const y1Array = highlightObjectArray.map(hl => hl.position.boundingRect.y1);
    const y2Array = highlightObjectArray.map(hl => hl.position.boundingRect.y2);
    const newBoundingRect = {
      x1: x1Array.length ? Math.min(...x1Array) : 0,
      x2: x2Array.length ? Math.max(...x2Array) : 0,
      y1: y1Array.length ? Math.min(...y1Array) : 0,
      y2: y2Array.length ? Math.max(...y2Array) : 0,
      width: 1,
      height: 1,
    };
    console.log('getConsolidatedHighlight', x1Array, x2Array, y1Array, y2Array, newBoundingRect);
    return newBoundingRect;
  };

  storeHypatosDataInField = (foundObjValue, mappedValue, highlightId, pgNo) => {
    console.log('hello', foundObjValue, mappedValue);
    const { initialValues } = this.state;
    if (!this.state.selectedFields.key) {
      return null;
    }
    if (['form', 'additional'].includes(this.state.selectedFields.type)) {
      const setFieldValue = {};
      console.log('2249', mappedValue, foundObjValue);
      setFieldValue[mappedValue] = this.props.form.getFieldValue(mappedValue).includes(foundObjValue)
        ? this.props.form.getFieldValue(mappedValue)
        : [...this.props.form.getFieldValue(mappedValue), foundObjValue];
      console.log('initialvalue', initialValues[this.state.selectedFields.key], foundObjValue);
      if (initialValues[this.state.selectedFields.key]) {
        if (initialValues[this.state.selectedFields.key].includes(foundObjValue)) {
          initialValues[this.state.selectedFields.key] = initialValues[this.state.selectedFields.key];
        } else {
          initialValues[this.state.selectedFields.key] = [
            ...initialValues[this.state.selectedFields.key],
            foundObjValue,
          ];
        }
      } else {
        initialValues[this.state.selectedFields.key] = Array(foundObjValue);
      }
      initialValues[`${this.state.selectedFields.key}-highlight`][foundObjValue] = highlightId;
      const newBoundingRect = this.getConsolidatedHighlight(
        initialValues[`${this.state.selectedFields.key}-highlight`],
      );
      const { newHighlights } = this.state;
      const uuid = Object.values(newHighlights).find(hl => hl.key === this.state.selectedFields.key)
        ? Object.values(newHighlights).find(hl => hl.key === this.state.selectedFields.key).id
        : uuidv4();
      initialValues[`${this.state.selectedFields.key}-highlightId`] = uuid;
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: pgNo,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: initialValues[this.state.selectedFields.key],
        key: this.state.selectedFields.key,
        rowIndex: this.state.selectedFields.row,
      };
      newHighlights[uuid] = highlightObject;
      initialValues[`${this.state.selectedFields.key}-confidence`] = 0.7;
      this.props.form.setFieldsValue(setFieldValue);
      console.log('initial values', initialValues, newHighlights);
      this.setState({ initialValues, newHighlights }, () => this.updateHash(uuid));
    } else {
      this.updateTableDataTags(
        foundObjValue,
        this.state.selectedFields.key,
        this.state.selectedFields.row,
        highlightId,
        pgNo,
      );
    }
  };

  onReturnHighlight = highlight => {
    console.log('hello', highlight, this.state.highlights.find(hl => hl.id === highlight.id));
    const foundObj = this.state.highlights.find(hl => hl.id === highlight.id) || this.state.newHighlights[highlight.id];
    const foundObjValue = foundObj.word;
    const keyToFormMapping = {
      supplierInvoiceNumber: 'invoiceNumber',
    };
    const mappedValue = keyToFormMapping[this.state.selectedFields.key] || this.state.selectedFields.key;
    this.storeHypatosDataInField(foundObjValue, mappedValue, highlight.id, highlight.position.pageNumber);
  };

  handleTextSelection = (scaledPosition, content) => {
    console.log('click identified', scaledPosition, content);
    if (!this.state.selectedFields || !this.state.selectedFields.key) {
      return;
    }
    let source = 'text-selection';
    if (content.image) {
      source = 'area-selection';
    }
    const keyToFormMapping = {
      supplierInvoiceNumber: 'invoiceNumber',
    };
    const mappedValue = keyToFormMapping[this.state.selectedFields.key] || this.state.selectedFields.key;
    const zoomDivisionFactor = this.state.currentZoom / 100;
    const areaRect = {
      x1: scaledPosition.boundingRect.x1 / scaledPosition.boundingRect.width / zoomDivisionFactor,
      x2: scaledPosition.boundingRect.x2 / scaledPosition.boundingRect.width / zoomDivisionFactor,
      y1: scaledPosition.boundingRect.y1 / scaledPosition.boundingRect.height / zoomDivisionFactor,
      y2: scaledPosition.boundingRect.y2 / scaledPosition.boundingRect.height / zoomDivisionFactor,
    };
    if (source === 'text-selection') {
      // this.storeHypatosDataInField(content.text, mappedValue);
    } else {
      const filteredHighlights = this.state.highlights.filter(hl => {
        const { boundingRect } = hl.position;
        const x1LiesInSelection = areaRect.x1 < boundingRect.x1 && boundingRect.x1 < areaRect.x2;
        const x2LiesInSelection = areaRect.x1 < boundingRect.x2 && boundingRect.x2 < areaRect.x2;
        const y1LiesInSelection = areaRect.y1 < boundingRect.y1 && boundingRect.y1 < areaRect.y2;
        const y2LiesInSelection = areaRect.y1 < boundingRect.y2 && boundingRect.y2 < areaRect.y2;

        if (
          (x1LiesInSelection || x2LiesInSelection) &&
          (y1LiesInSelection || y2LiesInSelection) &&
          hl.position.pageNumber === scaledPosition.pageNumber
        )
          return true;
        return false;
      });
      const x1Array = filteredHighlights.map(hl => hl.position.boundingRect.x1);
      const x2Array = filteredHighlights.map(hl => hl.position.boundingRect.x2);
      const y1Array = filteredHighlights.map(hl => hl.position.boundingRect.y1);
      const y2Array = filteredHighlights.map(hl => hl.position.boundingRect.y2);
      const newBoundingRect = {
        x1: Math.min(...x1Array),
        x2: Math.max(...x2Array),
        y1: Math.min(...y1Array),
        y2: Math.max(...y2Array),
        width: 1,
        height: 1,
      };
      const uuid = uuidv4();
      const filteredWords = filteredHighlights
        .filter(hl => hl.source === 'word')
        .map(hl => hl.word)
        .join(
          ['quantity', 'price', 'lineItemTotal', 'subTotal', 'totalTaxes', 'value'].includes(
            this.state.selectedFields.key,
          )
            ? ''
            : ' ',
        );
      console.log('filtered words', filteredHighlights, filteredWords);
      const highlightObject = {
        position: {
          boundingRect: newBoundingRect,
          rects: [newBoundingRect],
          pageNumber: scaledPosition.pageNumber,
        },
        id: uuid,
        confidence: 0.7,
        source: 'new-highlight',
        word: filteredWords,
        key: this.state.selectedFields.key,
        rowIndex: this.state.selectedFields.row,
      };
      const { newHighlights } = this.state;
      newHighlights[uuid] = highlightObject;
      this.setState({ newHighlights });
      this.storeHypatosDataInField(filteredWords, mappedValue, uuid, scaledPosition.pageNumber);
    }
  };

  handleZoomClick = value => {
    console.log('hey');
    if (value === -25 && this.state.currentZoom === 50) {
      return;
    }
    if (value === 25 && this.state.currentZoom === 150) {
      return;
    }
    return this.setState({ currentZoom: this.state.currentZoom + value });
  };

  handleRotateClick = value => {
    if (value === -90 && this.state.currentRotation === 0) {
      return this.setState({ currentRotation: 270 });
    }
    if (value === 90 && this.state.currentRotation === 270) {
      return this.setState({ currentRotation: 0 });
    }
    return this.setState({ currentRotation: this.state.currentRotation + value });
  };

  render() {
    if (this.state.pageLoader || this.state.loadDataInState) {
      return <LoadingContent />;
    }
    // 'https://aerchain-dev.s3-us-west-2.amazonaws.com/1234.pdf'
    return (
      <Content style={ContentStyle}>
        <PageHeader
          ghost={false}
          onBack={() => this.props.history.push(`verify`)}
          title={this.props.invoiceDetails.get('code')}
          tags={
            <Tag color={invStatusCodes[this.props.invoiceDetails.get('status')]}>
              {this.props.invoiceDetails.get('status')}
            </Tag>
          }
          extra={[
            <span>
              <Button
                icon={<CloseOutlined />}
                disabled={this.props.submitBtnLoader}
                onClick={() => this.props.history.push(`verify`)}
              >
                Cancel
              </Button>
              &ensp;
              <Button
                loading={this.props.submitBtnLoader}
                type="default"
                icon={<SaveOutlined />}
                onClick={() => this.submitInvoiceForm('SAVE')}
              >
                Save
              </Button>
              &ensp;
              <Button
                loading={this.props.submitBtnLoader}
                type="primary"
                onClick={() => this.submitInvoiceForm('SUBMIT')}
              >
                Submit
              </Button>
            </span>,
          ]}
        />
        {console.log('highlights', this.state.highlights)}
        <ContentDiv>
          <Row gutter={24}>
            <Col span={12} className="left-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Button icon={<UndoOutlined />} onClick={() => this.handleRotateClick(-90)} />
                &ensp;
                <Button icon={<ZoomOutOutlined />} onClick={() => this.handleZoomClick(-25)} />
                &ensp;
                {this.state.currentZoom} %&ensp;
                <Button icon={<ZoomInOutlined />} onClick={() => this.handleZoomClick(25)} />
                &ensp;
                <Button icon={<RedoOutlined />} onClick={() => this.handleRotateClick(90)} />
              </div>
              <div
                className="pdf-parent"
                style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', overflow: 'scroll' }}
              >
                <Card
                  style={{ width: '100%', height: '100%' }}
                  className={`pdf-card zoom${this.state.currentZoom} rotate${this.state.currentRotation}`}
                >
                  {console.log('highlight console', this.state.highlights, Object.values(this.state.newHighlights))}
                  <PdfLoader url={this.props.invoiceDetails.getIn(['meta', 'publicUrl'])} beforeLoad={<Spin />}>
                    {pdfDocument => (
                      <PdfHighlighter
                        pdfDocument={pdfDocument}
                        enableAreaSelection={event => event.type === 'mousedown'}
                        scrollRef={scrollTo => {
                          this.scrollViewerTo = scrollTo;
                          this.scrollToHighlightFromHash();
                        }}
                        returnHighlight={highlight => this.onReturnHighlight(highlight)}
                        onSelectionFinished={(scaledPosition, content) =>
                          this.handleTextSelection(scaledPosition, content)
                        }
                        highlightTransform={(
                          highlight,
                          index,
                          setTip,
                          hideTip,
                          viewportToScaled,
                          screenshot,
                          isScrolledTo,
                        ) => {
                          const isTextHighlight = !(highlight.content && highlight.content.image);
                          const component = isTextHighlight ? (
                            <Highlight
                              isScrolledTo={isScrolledTo}
                              position={highlight.position}
                              comment={highlight.comment}
                            />
                          ) : (
                            <AreaHighlight
                              highlight={highlight}
                              onChange={boundingRect => {
                                this.updateHighlight(
                                  highlight.id,
                                  { boundingRect: viewportToScaled(boundingRect) },
                                  { image: screenshot(boundingRect) },
                                );
                              }}
                            />
                          );

                          return (
                            <Popup
                              popupContent={highlight.content}
                              onMouseOver={popupContent => setTip(highlight, () => popupContent)}
                              onFocus={() => null}
                              onMouseOut={hideTip}
                              onBlur={() => null}
                              key={index}
                              children={component}
                            />
                          );
                        }}
                        highlights={[...this.state.highlights, ...Object.values(this.state.newHighlights)]}
                      />
                    )}
                  </PdfLoader>
                </Card>
              </div>
            </Col>
            <Col span={12}>{this.renderUpdateCard()}</Col>
          </Row>
          {this.state.openCurrencySelectModal && (
            <CurrencySelectModal
              onCancel={() => this.setState({ openCurrencySelectModal: false })}
              selectedCurrency={this.state.selectedCurrency}
              updateCurrencyItem={this.updateCurrencyItem}
            />
          )}
          <PaymentTermsModal
            initialPaymentTerms={this.props.invoiceDetails.getIn(['Supplier', 'paymentTerms'])}
            visible={this.state.displayPaymentTermsModal}
            selectPaymentTerms={data => this.setState({ selectedPaymentTerms: data, displayPaymentTermsModal: false })}
            handleCancel={() => this.setState({ displayPaymentTermsModal: false })}
          />
        </ContentDiv>
      </Content>
    );
  }
}

const mapStateToProps = bossState => {
  const pageReduxState = bossState.get('invoiceDetails');
  return {
    pathname: bossState.getIn(['router', 'location', 'pathname']),
    taxes: bossState.getIn(['activeTaxes', 'activeTaxes']),
    taxesLoader: bossState.get('activeTaxesLoader'),
    invoiceDetails: pageReduxState.get('invoiceDetails'),
    uoms: bossState.getIn(['productSearchData', 'uoms']),
    isUomLoaded: bossState.getIn(['productSearchData', 'isUomLoaded']),
    uomsWithSubUom: bossState.getIn(['productSearchData', 'uomsWithSubUom']),
    isUomWithSubUomLoaded: bossState.getIn(['productSearchData', 'isUomWithSubUomLoaded']),
    supplierSearchLoader: bossState.getIn(['suppliers', 'searchLoader']),
    supplierSearchResults: bossState.getIn(['suppliers', 'searchResults']),
    supplierDetails: bossState.getIn(['suppliers', 'supplierDetails']),
    supplierDetailsLoader: bossState.getIn(['suppliers', 'detailsLoader']),
    baseCurrency: bossState.getIn(['auth', 'baseCurrency']),
    paymentTerms: pageReduxState.get('paymentTerms'),
    submitBtnLoader: bossState.getIn(['invoicesEdit', 'submitBtnLoader']),
  };
};

const mapDispatchToProps = dispatch => ({
  getActiveTaxes: () => dispatch(getActiveTaxes()),
  amendOCRInvoice: (id, json, history, destination, type) => dispatch(amendOCRInvoice(id, json, history, destination, type)),
  getUOMs: () => dispatch(getUOMs()),
  getUOMsWithSubUoms: data => dispatch(getUOMsWithSubUoms(data)),
  getSuppliers: params => dispatch(getSuppliers(params)),
  getSupplierDetails: id => dispatch(getSupplierDetails(id)),
  getActivePaymentTerms: (preConst, postConst) => dispatch(getActivePaymentTerms(preConst, postConst)),
  displayActivityOverlay: (id, type, uploadType, EUMs) => dispatch(displayActivityOverlay(id, type, uploadType, EUMs)),
  displayCommentsOverlay: (id, type, uploadType) => dispatch(displayCommentsOverlay(id, type, uploadType)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Form.create()(InvoicesVerifyEdit));
