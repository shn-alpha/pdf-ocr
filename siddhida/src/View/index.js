/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { OrderedMap, Map } from 'immutable';

import {
  ClockCircleOutlined,
  EditOutlined,
  MessageOutlined,
  RedoOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';

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
import { amendInvoice } from '../../../Invoices/Edit/actions';
import { getInvoiceDetails } from '../../actions';
import { formItemStyle } from '../../../../utils/commons';
import PaymentTermsPopover from '../../../../components/PaymentTermsPopover';
import CurrencySelectModal from '../../../../components/CurrencySelectModal';
import PaymentTermsModal from '../../../../components/PaymentTermsModal';
import { GET_PT, STORE_PT } from '../../constants';
import ActivityTimeline from '../../../ActivityTimeline';
import CommentsOverlay from '../../../Comments/Loadable';

const { Content } = Layout;
const { Description } = DescriptionList;
const { Option } = Select;

const detailsStyle = { fontSize: '9px' };
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

class InvoicesVerify extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageLoader: true,
      // locationData: {},
      // isEdit: false,
      // tableData: OrderedMap(),
      // tableDataIndex: 1,
      // tableDataPopulated: false,
      // subUOMMap: Map(),
      // disabledFields: {},
      // initialValues: {},
      selectedCurrency: Map(),
      // clickedHighlight: {},
      selectedFields: {
        key: undefined,
        type: undefined,
      },
      currentZoom: 75,
      currentRotation: 0,
    };
    this.highlights = [];
  }

  async componentDidMount() {
    const id = this.props.pathname.split('/')[2];
    await this.props.getInvoiceDetails(id);
    const locationData = this.props.invoiceDetails.get('locationData');
    const tableItems = locationData.get('items') ? locationData.get('items').toArray() : [];
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
    const highlights = [];
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
        key: fk,
        word: locationData.getIn([fk, 'word']),
      };
      highlights.push(highlightObject);
    });

    tableItems.forEach((item, rowIndex) => {
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
          key: fk,
          rowIndex,
          lineItemId: item.get('lineItemId'),
          word: item.getIn([fk, 'word']),
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
          key: `${afk}-${fk}`,
          word: locationData.getIn([afk, fk, 'word']),
        };
        highlights.push(highlightObject);
      });
    });
    this.highlights = highlights;
    this.setState({ pageLoader: false });
    window.addEventListener('hashchange', this.scrollToHighlightFromHash, false);
  }

  getHighlightById = id => this.highlights.find(highlight => highlight.id === id);

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

  updateHashForSelectedField = (key, e) => {
    if (e && this.state.selectedFields.key === key) {
      e.stopPropagation();
    }
    const locationDataObjWithKey = this.props.invoiceDetails.getIn(['locationData', key]);
    this.updateHash(locationDataObjWithKey.get('cellId'));
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

  updateHashForSelectedAdditionalField = key => {
    console.log('this.highlights', this.highlights, key);
    const locationDataObjWithKey = this.highlights.find(hl => hl.source === 'additional' && hl.key === key);
    this.updateHash(locationDataObjWithKey.id);
  };

  getConfidenceScoreClassName = score => {
    if (!score) {
      return 'red-confidence';
    }
    if (score > 0.8) {
      return 'green-confidence';
    }
    return 'orange-confidence';
  };

  renderAdditionalDataCards = action => {
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
                      className="invoiceVerifyAdditionalData"
                      style={{ ...detailsStyle, width: '100%' }}
                      onClick={() => this.updateHashForSelectedAdditionalField(`${afk}-${field}`)}
                    >
                      {locationData.getIn([afk, field, 'word'])}
                    </Description>
                  ))}
              </DescriptionList>
            </Card>
          ))}
      </div>
    );
  };

  renderDetailsCard = () => {
    const { invoiceDetails } = this.props;
    const locationData = invoiceDetails.get('locationData');
    let symbol = invoiceDetails.getIn(['Currency', 'symbol']);
    if (
      invoiceDetails.get('status') === 'human-review' &&
      invoiceDetails.getIn(['locationData', 'currency', 'word']) !== ''
    ) {
      symbol = invoiceDetails.getIn(['locationData', 'currency', 'word']);
    }
    const pdfColumns = [
      {
        title: 'Product',
        dataIndex: 'product',
        key: 'product',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['name', 'cellId']),
                );
              }}
            >
              {text}
            </span>
          ),
        }),
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity',
        className: 'center-align',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['quantity', 'cellId']),
                );
              }}
            >{`${text ? text.toLocaleString('en-in') : '-'}`}</span>
          ),
        }),
      },
      {
        title: 'Uom',
        dataIndex: 'uom',
        key: 'uom',
        className: 'center-align',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['uom', 'cellId']),
                );
              }}
            >
              {text}
            </span>
          ),
        }),
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        className: 'center-align',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['price', 'cellId']),
                );
              }}
            >{`${symbol || ''} ${text ? text.toLocaleString('en-in') : '-'}`}</span>
          ),
        }),
      },
      {
        title: 'TAX %',
        dataIndex: 'gst',
        key: 'gst',
        className: 'center-align',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['taxPercent', 'cellId']),
                );
              }}
            >
              {text}
            </span>
          ),
        }),
      },
      {
        title: 'Total',
        dataIndex: 'lineItemTotal',
        key: 'lineItemTotal',
        className: 'center-align',
        render: (text, record) => ({
          children: (
            <span
              style={{
                ...detailsStyle,
              }}
              onClick={() => {
                this.updateHash(
                  locationData
                    .get('items')
                    .toArray()
                    [record.index].getIn(['lineItemTotal', 'cellId']),
                );
              }}
            >
              {`${symbol || ''} ${text}`}
            </span>
          ),
        }),
      },
    ];

    let pdfRows = [];
    if (this.props.invoiceDetails.getIn(['locationData', 'items'])) {
      pdfRows = this.props.invoiceDetails
        .getIn(['locationData', 'items'])
        .filter(item => item.get('active'))
        .toArray()
        .map((item, index) => ({
          index,
          product: item.getIn(['name', 'word']),
          quantity: item.getIn(['quantity', 'word']),
          price: item.getIn(['price', 'word']),
          lineItemTotal: item.getIn(['lineItemTotal', 'word']),
          gst: item.getIn(['taxPercent', 'word']),
          uom: item.getIn(['uom', 'word']),
        }));
    }

    return (
      <Card
        bordered={false}
        className="details-card"
        style={{ display: 'flex', flex: 49, height: 'calc(100vh - 100px)', overflow: 'scroll' }}
      >
        <DescriptionList size="small" layout="vertical" col={1}>
          <Description
            key="Supplier"
            term="Supplier"
            className={this.getConfidenceScoreClassName(
              this.props.invoiceDetails.getIn(['locationData', 'supplierCompanyName', 'confidence']),
            )}
            style={{ ...detailsStyle, width: '100%' }}
            onClick={() => this.updateHashForSelectedField('supplierCompanyName')}
          >
            {/* {this.props.invoiceDetails.getIn(['Supplier', 'name'])} */}
            {this.getWord('supplierCompanyName', 'form')}
          </Description>
          <Description
            key="paymentTerms"
            term="Payment Terms"
            className="invoiceVerifyDetails"
            style={{ ...detailsStyle, width: '100%' }}
          >
            <PaymentTermsPopover paymentTerms={this.props.invoiceDetails.get('paymentTerms')} />
          </Description>
          {/* {this.props.invoiceDetails.getIn(['PO', 'reference']) && ( */}
          <Description
            key="PO Number"
            term="PO Number"
            className={this.getConfidenceScoreClassName(
              this.props.invoiceDetails.getIn(['locationData', 'referenceCode', 'confidence']),
            )}
            style={{ ...detailsStyle, width: '100%' }}
            onClick={() => this.updateHashForSelectedField('referenceCode')}
          >
            {/* {this.props.invoiceDetails.getIn(['PO', 'reference']) || '-'} */}
            {this.getWord('referenceCode', 'form')}
          </Description>
          {/* )} */}
          <Description
            key="Invoice Number"
            term="Invoice Number"
            className={this.getConfidenceScoreClassName(
              this.props.invoiceDetails.getIn(['locationData', 'supplierInvoiceNumber', 'confidence']),
            )}
            style={{ ...detailsStyle, width: '100%' }}
            onClick={() => this.updateHashForSelectedField('supplierInvoiceNumber')}
          >
            {/* {this.props.invoiceDetails.get('reference')} */}
            {this.getWord('supplierInvoiceNumber', 'form')}
          </Description>
          <Description
            key="Purchaser"
            term="Purchaser"
            className="invoiceVerifyDetails"
            style={{ ...detailsStyle, width: '100%' }}
          >
            {this.props.invoiceDetails.getIn(['User', 'name'])}
          </Description>
          {this.props.invoiceDetails.getIn(['PO', 'poDate']) && (
            <Description
              key="PO Date"
              term="PO Date"
              className="invoiceVerifyDetails"
              style={{ ...detailsStyle, width: '100%' }}
            >
              {getUTCForInvoiceExtraction(this.props.invoiceDetails.getIn(['PO', 'poDate']))}
            </Description>
          )}
          <Description
            key="Invoice Date"
            term="Invoice Date"
            className={this.getConfidenceScoreClassName(
              this.props.invoiceDetails.getIn(['locationData', 'invoiceDate', 'confidence']),
            )}
            style={{ ...detailsStyle, width: '100%' }}
            onClick={() => this.updateHashForSelectedField('invoiceDate')}
          >
            {/* {getUTCInMonthName(this.props.invoiceDetails.get('invoiceDate'))} */}
            {this.getWord('invoiceDate', 'form')}
          </Description>
        </DescriptionList>
        {/* </Col>
        </Row> */}
        <Row>
          <Table
            tableLayout="auto"
            size="medium"
            style={{ marginTop: '30px' }}
            bordered
            columns={pdfColumns}
            dataSource={pdfRows}
            pagination={false}
            className="invoice-verify-table view"
            scroll={{ x: true, y: 0 }}
          />
        </Row>
        <Row style={{ marginTop: '10px' }}>
          <Col span={12} offset={12}>
            <DescriptionList
              size="small"
              layout="horizontal"
              style={{ textAlign: 'right', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
              col={1}
            >
              <Description
                key="Sub Total"
                term="Sub Total"
                className={this.getConfidenceScoreClassName(
                  this.props.invoiceDetails.getIn(['locationData', 'subTotal', 'confidence']),
                )}
                style={{ width: '100%' }}
                onClick={() => this.updateHashForSelectedField('subTotal')}
              >
                {`${symbol || ''} ${this.getWord('subTotal', 'form') ? this.getWord('subTotal', 'form') : '-'}`}
              </Description>
              <Description
                key="Tax Value"
                term="Tax Value"
                className={this.getConfidenceScoreClassName(
                  this.props.invoiceDetails.getIn(['locationData', 'totalTaxes', 'confidence']),
                )}
                style={{ width: '100%' }}
                onClick={() => this.updateHashForSelectedField('totalTaxes')}
              >
                {`${symbol || ''} ${this.getWord('totalTaxes', 'form') ? this.getWord('totalTaxes', 'form') : '-'}`}
              </Description>
              <Description
                key="Invoice Value"
                term="Invoice Value"
                className={this.getConfidenceScoreClassName(
                  this.props.invoiceDetails.getIn(['locationData', 'value', 'confidence']),
                )}
                style={{ width: '100%' }}
                onClick={() => this.updateHashForSelectedField('value')}
              >
                {`${symbol || ''} ${this.getWord('value', 'form') ? this.getWord('value', 'form') : '-'}`}
              </Description>
            </DescriptionList>
          </Col>
        </Row>
        <br />
        {this.renderAdditionalDataCards('details')}
      </Card>
    );
  };

  isSupplierCommentDisabled = () => {
    const { invoiceDetails } = this.props;
    if (invoiceDetails.get('status') === 'pending-approval') {
      return true;
    }
    return false;
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
    if (this.state.pageLoader) {
      return <LoadingContent />;
    }
    // console.log('clicked highlight', this.state.clickedHighlight, this.highlights.map(hl => hl.id).includes(this.state.clickedHighlight.id))

    // 'https://aerchain-dev.s3-us-west-2.amazonaws.com/1234.pdf'
    return (
      <Content style={ContentStyle}>
        <PageHeader
          ghost={false}
          onBack={() =>
            this.props.invoiceDetails.get('status') === 'human-review'
              ? this.props.history.push('/invoices')
              : this.props.history.push(`/invoices/${this.props.pathname.split('/')[2]}`)
          }
          title={this.props.invoiceDetails.get('code')}
          tags={
            <Tag color={invStatusCodes[this.props.invoiceDetails.get('status')]}>
              {this.props.invoiceDetails.get('status')}
            </Tag>
          }
          extra={[
            <span>
              <Button.Group style={{ marginLeft: '8px' }}>
                <Tooltip placement="top" title="Activity Timeline">
                  <Button
                    onClick={() =>
                      this.props.displayActivityOverlay(
                        this.props.invoiceDetails.get('id'),
                        'invoices',
                        'INV-attachments',
                        this.props.invoiceDetails.get('EUMs'),
                      )
                    }
                    icon={<ClockCircleOutlined />}
                  />
                </Tooltip>
                <Tooltip placement="top" title="Supplier Comments">
                  <Button
                    onClick={() =>
                      this.props.displayCommentsOverlay(
                        this.props.invoiceDetails.get('id'),
                        'invoices',
                        'INV-attachments',
                      )
                    }
                    icon={<MessageOutlined />}
                    disabled={this.isSupplierCommentDisabled()}
                  />
                </Tooltip>
              </Button.Group>
              {['draft', 'human-review', 'extraction-duplicate-invoice'].includes(
                this.props.invoiceDetails.get('status'),
              ) ? (
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    onClick={() =>
                      this.props.history.push(`/invoices/${this.props.invoiceDetails.get('id')}/verify-edit`)
                    }
                  >
                  Edit
                  </Button>
                ) : (
                  <span />
                )}
            </span>,
          ]}
        />
        <ContentDiv>
          <Row gutter={24}>
            <Col span={12}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // width: '100%',
                  // position: 'absolute',
                  // zIndex: 2,
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
                  <PdfLoader url={this.props.invoiceDetails.getIn(['meta', 'publicUrl'])} beforeLoad={<Spin />}>
                    {pdfDocument => (
                      <PdfHighlighter
                        pdfDocument={pdfDocument}
                        enableAreaSelection={event => event.altKey}
                        // onScrollChange={this.resetHash}
                        scrollRef={scrollTo => {
                          this.scrollViewerTo = scrollTo;
                          this.scrollToHighlightFromHash();
                        }}
                        // returnHighlight={highlight => this.onReturnHighlight(highlight)}
                        // onSelectionFinished={(scaledPosition, content) =>
                        //   this.handleTextSelection(scaledPosition, content)
                        // }
                        onSelectionFinished={() => null}
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
                        highlights={this.highlights}
                      />
                    )}
                  </PdfLoader>
                </Card>
              </div>
            </Col>
            <Col span={12}>{this.renderDetailsCard()}</Col>
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
          {this.props.overlayVisible && <ActivityTimeline />}
          {this.props.commentsOverlayVisible && <CommentsOverlay />}
        </ContentDiv>
      </Content>
    );
  }
}

const mapStateToProps = bossState => {
  const pageReduxState = bossState.get('invoiceDetails');
  const activityTimeline = bossState.get('activityTimeline');
  const comments = bossState.get('comments');
  return {
    commentsOverlayVisible: comments.get('overlayVisible'),
    overlayVisible: activityTimeline.get('overlayVisible'),
    pathname: bossState.getIn(['router', 'location', 'pathname']),
    taxes: bossState.getIn(['activeTaxes', 'activeTaxes']),
    taxesLoader: bossState.get('activeTaxesLoader'),
    // pageLoader: pageReduxState.get('pageLoader'),
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
  getInvoiceDetails: invoiceId => dispatch(getInvoiceDetails(invoiceId)),
  getActiveTaxes: () => dispatch(getActiveTaxes()),
  amendInvoice: (id, json, history, destination, type) => dispatch(amendInvoice(id, json, history, destination, type)),
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
)(Form.create()(InvoicesVerify));
