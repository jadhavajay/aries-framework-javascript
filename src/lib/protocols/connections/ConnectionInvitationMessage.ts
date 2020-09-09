import { Equals, IsString, ValidateIf, IsArray } from 'class-validator';

import { AgentMessage } from '../../agent/AgentMessage';
import { MessageType } from './messages';

// TODO: improve typing of `DIDInvitationData` and `InlineInvitationData` so properties can't be mixed
export interface InlineInvitationData {
  recipientKeys: string[];
  serviceEndpoint: string;
  routingKeys?: string[];
}

export interface DIDInvitationData {
  did: string;
}

/**
 * Message to invite another agent to create a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/master/features/0160-connection-protocol/README.md#0-invitation-to-connect
 */
export class ConnectionInvitationMessage extends AgentMessage {
  /**
   * Create new ConnectionInvitationMessage instance.
   * @param options
   */
  public constructor(options: { id?: string; label: string } & (DIDInvitationData | InlineInvitationData)) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.label = options.label;

      if (isDidInvitation(options)) {
        this.did = options.did;
      } else {
        this.recipientKeys = options.recipientKeys;
        this.serviceEndpoint = options.serviceEndpoint;
        this.routingKeys = options.routingKeys;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (options.did && (options.recipientKeys || options.routingKeys || options.serviceEndpoint)) {
        throw new Error('either the did or the recipientKeys/serviceEndpoint/routingKeys must be set, but not both');
      }
    }
  }

  @Equals(ConnectionInvitationMessage.type)
  public readonly type = ConnectionInvitationMessage.type;
  public static readonly type = MessageType.ConnectionInvitation;

  @IsString()
  public label!: string;

  @IsString()
  @ValidateIf((o: ConnectionInvitationMessage) => o.recipientKeys === undefined)
  public did?: string;

  @IsString({
    each: true,
  })
  @IsArray()
  @ValidateIf((o: ConnectionInvitationMessage) => o.did === undefined)
  public recipientKeys?: string[];

  @IsString()
  @ValidateIf((o: ConnectionInvitationMessage) => o.did === undefined)
  public serviceEndpoint?: string;

  @IsString({
    each: true,
  })
  @ValidateIf((o: ConnectionInvitationMessage) => o.did === undefined)
  public routingKeys?: string[];
}

/**
 * Check whether an invitation is a `DIDInvitationData` object
 *
 * @param invitation invitation object
 */
function isDidInvitation(invitation: InlineInvitationData | DIDInvitationData): invitation is DIDInvitationData {
  return (invitation as DIDInvitationData).did !== undefined;
}
