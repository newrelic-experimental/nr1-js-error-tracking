import React from 'react';
import {
  NrqlQuery,
  NerdGraphQuery,
  PlatformStateContext,
  NerdletStateContext,
  AccountPicker,
  BarChart,
  Select,
  SelectItem,
  Checkbox,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody
} from 'nr1';
import { Timeline, timeRangeToNrql } from '@newrelic/nr1-community';
import { Pagination } from 'semantic-ui-react';
import LabelValue from './LabelValue';

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class JsErrorTrackingNerdletNerdlet extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      errorMessage: null,
      session: null,
      appName: null,
      accountId: null,
      entityGuid: null,
      eventCount: 10,
      pageView: true,
      browserInteraction: true,
      activePage: 1
    };

    this.onChangeAccount = this.onChangeAccount.bind(this);
  }

  componentDidMount() {
    const p = new Promise((resolve, reject) => reject());
    if (this.state.entityGuid) {
      p.then(() => {
        return NerdGraphQuery.query({
          query: this.entityToAccountQuery,
          variables: {
            id: this.state.entityGuid
          }
        }).then(result => {
          if (this.state.accountId !== result.data.actor.entity.accountId) {
            this.setState({
              accountId: result.data.actor.entity.accountId,
              appName: result.data.actor.entity.name
            });
          }
        });
      });
    }
  }

  entityToAccountQuery = `
    query ($id: EntityGuid) {
        actor {
            entity(guid: $id) {
                accountId
                name
            }
        }
    }
    `;

  onChangeAccount(value) {
    // alert(`Selected account: ${value}`);

    this.setState({ accountId: value });
  }

  onSelectError(record) {
    this.setState({ errorMessage: record.metadata.name });
  }

  onSelectEventCount(eventCount) {
    this.setState({ eventCount });
  }

  onSelectSession(record) {
    this.setState({ session: record.metadata.name });
  }

  onSelectApp(record) {
    this.setState({ appName: record.metadata.name });
  }

  onPaginationChange(activePage) {
    this.setState({ activePage });
  }

  render() {
    const { activePage } = this.state;
    return (
      <NerdletStateContext.Consumer>
        {nerdletState => {
          if (this.state.entityGuid !== nerdletState.entityGuid) {
            this.setState({ entityGuid: nerdletState.entityGuid });
          }
          return (
            <PlatformStateContext.Consumer>
              {platformState => {
                const since = timeRangeToNrql(platformState);
                if (this.state.since !== since) {
                  this.setState({ since });
                }

                return (
                  <>
                    {!nerdletState.entityGuid && (
                      <AccountPicker
                        value={this.state.accountId}
                        onChange={this.onChangeAccount}
                      />
                    )}
                    <Grid
                      spacingType={[
                        Grid.SPACING_TYPE.MEDIUM,
                        Grid.SPACING_TYPE.MEDIUM
                      ]}
                    >
                      <GridItem columnSpan={3}>
                        <Card>
                          <CardHeader title="Application" />
                          <CardBody>
                            {this.state.accountId ? (
                              <NrqlQuery
                                accountId={this.state.accountId}
                                query={`FROM JavaScriptError SELECT count(*) FACET appName ${this.state.since}`}
                              >
                                {({ data }) => {
                                  if (data) {
                                    return (
                                      <BarChart
                                        onClickBar={record =>
                                          this.onSelectApp(record)
                                        }
                                        data={data}
                                      />
                                    );
                                  }
                                  return <BarChart data={[]} />;
                                }}
                              </NrqlQuery>
                            ) : (
                              <BarChart data={[]} />
                            )}
                          </CardBody>
                        </Card>
                      </GridItem>
                      <GridItem columnSpan={6}>
                        <Card>
                          <CardHeader title="ErrorMessage" />
                          <CardBody>
                            {this.state.appName ? (
                              <NrqlQuery
                                accountId={this.state.accountId}
                                query={`FROM JavaScriptError SELECT count(*) FACET errorMessage ${this.state.since} WHERE appName = '${this.state.appName}'`}
                              >
                                {({ data }) => {
                                  if (data) {
                                    return (
                                      <BarChart
                                        onClickBar={record =>
                                          this.onSelectError(record)
                                        }
                                        data={data}
                                        fullWidth
                                      />
                                    );
                                  }
                                  return <BarChart data={[]} fullWidth />;
                                }}
                              </NrqlQuery>
                            ) : (
                              <BarChart data={[]} fullWidth />
                            )}
                          </CardBody>
                        </Card>
                      </GridItem>
                      <GridItem columnSpan={3}>
                        <Card>
                          <CardHeader title="Session" />
                          <CardBody>
                            {this.state.errorMessage ? (
                              <NrqlQuery
                                accountId={this.state.accountId}
                                query={`FROM JavaScriptError SELECT count(*) FACET session ${
                                  this.state.since
                                } WHERE appName = '${
                                  this.state.appName
                                }' AND errorMessage='${this.state.errorMessage.replace(
                                  /'/g,
                                  "\\'"
                                )}'`}
                              >
                                {({ data }) => {
                                  if (data) {
                                    return (
                                      <BarChart
                                        onClickBar={record =>
                                          this.onSelectSession(record)
                                        }
                                        data={data}
                                      />
                                    );
                                  }
                                  return <BarChart data={[]} fullWidth />;
                                }}
                              </NrqlQuery>
                            ) : (
                              <BarChart data={[]} fullWidth />
                            )}
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                    {this.state.session && (
                      <NrqlQuery
                        accountId={this.state.accountId}
                        query={`FROM JavaScriptError SELECT * ${
                          this.state.since
                        } WHERE appName = '${
                          this.state.appName
                        }' AND errorMessage='${this.state.errorMessage.replace(
                          /'/g,
                          "\\'"
                        )}' AND session ='${this.state.session}'`}
                      >
                        {({ data }) => {
                          if (data) {
                            const errors = data[0].data;
                            const targetEvent = errors[activePage - 1];
                            return (
                              <>
                                <Grid
                                  spacingType={[
                                    Grid.SPACING_TYPE.MEDIUM,
                                    Grid.SPACING_TYPE.MEDIUM
                                  ]}
                                >
                                  <GridItem columnSpan={12}>
                                    <Card>
                                      <CardHeader title="Errors" />
                                      <CardBody>
                                        <Pagination
                                          activePage={activePage}
                                          onPageChange={(e, { activePage }) =>
                                            this.onPaginationChange(activePage)
                                          }
                                          totalPages={errors.length}
                                        />
                                      </CardBody>
                                    </Card>
                                  </GridItem>
                                </Grid>
                                <Grid
                                  spacingType={[
                                    Grid.SPACING_TYPE.MEDIUM,
                                    Grid.SPACING_TYPE.MEDIUM
                                  ]}
                                >
                                  <GridItem columnSpan={12}>
                                    <Card>
                                      <CardHeader
                                        title={targetEvent.errorMessage}
                                      />
                                      <CardBody>
                                        <div className="detailAttributes">
                                          <LabelValue
                                            label="Action Text"
                                            value={targetEvent.actionText}
                                          />
                                          <LabelValue
                                            label="URL"
                                            value={targetEvent.pageUrl}
                                          />
                                          <LabelValue
                                            label="UserAgentOS"
                                            value={targetEvent.userAgentOS}
                                          />
                                          <LabelValue
                                            label="UserAgentName"
                                            value={targetEvent.userAgentName}
                                          />
                                          <LabelValue
                                            label="UserAgentVersion"
                                            value={targetEvent.userAgentVersion}
                                          />
                                        </div>
                                        <div className="detailTrace">
                                          <pre>{targetEvent.stackTrace}</pre>
                                        </div>
                                      </CardBody>
                                    </Card>
                                  </GridItem>
                                </Grid>
                                <Grid
                                  spacingType={[
                                    Grid.SPACING_TYPE.MEDIUM,
                                    Grid.SPACING_TYPE.MEDIUM
                                  ]}
                                >
                                  <GridItem columnSpan={12}>
                                    <Card>
                                      <CardBody>
                                        <Select
                                          value={this.state.eventCount}
                                          onChange={(evt, value) =>
                                            this.onSelectEventCount(value)
                                          }
                                        >
                                          <SelectItem value="10">
                                            10 Events
                                          </SelectItem>
                                          <SelectItem value="20">
                                            20 Events
                                          </SelectItem>
                                          <SelectItem value="50">
                                            50 Events
                                          </SelectItem>
                                        </Select>
                                        <Checkbox
                                          indeterminate
                                          label="PageAction"
                                        />
                                        <Checkbox
                                          checked={this.state.pageView}
                                          onChange={() =>
                                            this.setState(({ pageView }) => ({
                                              pageView: !pageView
                                            }))
                                          }
                                          label="PageView"
                                        />
                                        <Checkbox
                                          checked={
                                            this.state.browserInteraction
                                          }
                                          onChange={() =>
                                            this.setState(
                                              ({ browserInteraction }) => ({
                                                browserInteraction: !browserInteraction
                                              })
                                            )
                                          }
                                          label="BrowserInteraction"
                                        />
                                        <NrqlQuery
                                          accountId={this.state.accountId}
                                          query={`FROM PageAction${
                                            this.state.pageView
                                              ? ' , PageView'
                                              : ''
                                          }${
                                            this.state.browserInteraction
                                              ? ' , BrowserInteraction'
                                              : ''
                                          } SELECT * SINCE ${new Date(
                                            targetEvent.timestamp -
                                              1000 * 60 * 60
                                          ).getTime()} UNTIL ${
                                            targetEvent.timestamp
                                          } WHERE session ='${
                                            this.state.session
                                          }' LIMIT ${this.state.eventCount}`}
                                        >
                                          {({ data }) => {
                                            if (data) {
                                              if (data.length > 0 && data[0]) {
                                                const events = JSON.parse(
                                                  JSON.stringify(data[0].data)
                                                )
                                                  .filter(d => {
                                                    !d.actionName &&
                                                      d.browserInteractionName &&
                                                      (d.actionName = `Browser Interaction ${d.browserInteractionName}`);
                                                    return true;
                                                  })
                                                  .filter(d => {
                                                    !d.actionName &&
                                                      d.pageUrl &&
                                                      (d.actionName = `Access to ${d.pageUrl}`);
                                                    return true;
                                                  });
                                                return (
                                                  <Timeline data={events} />
                                                );
                                              } else {
                                                return <div />;
                                              }
                                            }
                                            return null;
                                          }}
                                        </NrqlQuery>
                                      </CardBody>
                                    </Card>
                                  </GridItem>
                                </Grid>
                              </>
                            );
                          }
                          return null;
                        }}
                      </NrqlQuery>
                    )}
                  </>
                );
              }}
            </PlatformStateContext.Consumer>
          );
        }}
      </NerdletStateContext.Consumer>
    );
  }
}
