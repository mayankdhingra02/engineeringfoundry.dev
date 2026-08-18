import Link from "next/link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { LessonCallout, LessonHeading } from "@/components/system-design-lesson";
import { CommonMistakes, FurtherReading, InterviewFollowUps, PracticeConnections, RememberThis, TradeoffTable, WorkedExample } from "@/components/system-design-article";
import { networkingSources } from "./sources";

const idempotencyFlow = `sequenceDiagram
  participant C as Client
  participant A as Payment API
  participant D as Database
  participant I as Idempotency store
  C->>A: Create payment + key X
  A->>D: Create payment
  D-->>A: Success
  A-xC: Response lost
  C->>A: Retry with key X
  A->>I: Look up key X
  I-->>A: Existing result
  A-->>C: Return original result`;

export function RestLessonContent() {
  return <>
    <LessonHeading level={2} id="contract-before-components">Design the contract before hiding it behind components</LessonHeading>
    <p>An API is the boundary clients depend on. Resource names, validation, error behavior, and retry semantics should remain understandable even if the implementation moves from one service to many.</p>
    <pre><code>{`POST   /urls
GET    /urls/{id}
DELETE /urls/{id}`}</code></pre>
    <p>Nouns identify resources; methods communicate the requested operation. Define input and output schemas, required fields, limits, and stable error shapes. Authorization belongs at or behind this boundary, but permission checks must still follow the resource.</p>

    <LessonHeading level={2} id="collection-behavior">Collections need deliberate behavior</LessonHeading>
    <p>Filtering and sorting belong in an explicit contract such as <code>GET /notifications?status=unread&amp;sort=-created_at</code>. Pagination needs its own stability decision, covered in the <Link href="/system-design/fundamentals/pagination">Pagination lesson</Link>. Version only when compatible evolution cannot carry the change; versioning does not excuse an unclear contract.</p>

    <LessonHeading level={2} id="async-api">Asynchronous work changes acknowledgement</LessonHeading>
    <WorkedExample title="Accept a video upload for processing">
      <pre><code>{`POST /video-uploads

202 Accepted
Location: /video-uploads/job_742`}</code></pre>
      <p>The response means processing was accepted, not completed. The contract needs a job identifier and a way to observe progress or failure. Internal workers can change without changing that external meaning.</p>
    </WorkedExample>

    <LessonHeading level={2} id="chat-api-exercise">Exercise: basic chat APIs</LessonHeading>
    <p>Design operations to create a conversation, send a message, and fetch history. Decide which identifiers the client provides and how a retry behaves.</p>
    <details><summary>Reveal one reasonable contract</summary><div><pre><code>{`POST /conversations
POST /conversations/{conversationId}/messages
GET  /conversations/{conversationId}/messages?limit=50&before=<cursor>`}</code></pre><p>The send operation should define an idempotency mechanism; history needs stable ordering and pagination. Authorization must verify conversation membership on every resource operation.</p></div></details>
    <CommonMistakes><ul><li>Putting verbs and implementation names into every path.</li><li>Returning <code>200</code> for every outcome and forcing clients to parse prose.</li><li>Leaking internal database schemas into a public contract.</li><li>Adding API versions before defining compatibility policy.</li></ul></CommonMistakes>
    <PracticeConnections ids={["url-shortener", "notification-service", "chat-system"]} />
    <FurtherReading items={networkingSources.rest} />
    <RememberThis><p>Make resources, inputs, outputs, errors, authorization, and asynchronous acknowledgement explicit. The contract should describe product behavior rather than expose the current service topology.</p></RememberThis>
  </>;
}

export function PaginationLessonContent() {
  return <>
    <LessonHeading level={2} id="why-pagination-breaks">A page boundary moves when the collection moves</LessonHeading>
    <p>Returning an unbounded collection wastes memory, bandwidth, and query work. Splitting it into pages looks simple until new rows arrive or old rows disappear between requests.</p>

    <LessonHeading level={2} id="offset-pagination">Offset pagination</LessonHeading>
    <pre><code>{`GET /posts?limit=20&offset=40`}</code></pre>
    <p>Offsets are easy to understand and support explicit page navigation. Large offsets may require the data store to skip substantial work, and concurrent inserts or deletes can shift items so a client sees duplicates or misses entries.</p>

    <LessonHeading level={2} id="cursor-pagination">Cursor pagination</LessonHeading>
    <pre><code>{`GET /posts?limit=20&after=eyJjcmVhdGVkQXQiOi...`}</code></pre>
    <p>A cursor represents a position in a stable ordering, commonly based on an ordered field plus a unique tiebreaker. The server returns the next opaque cursor; clients should not construct or depend on its encoding.</p>
    <TradeoffTable><table><thead><tr><th>Requirement</th><th>Offset</th><th>Cursor</th></tr></thead><tbody><tr><td>Small administrative table</td><td>Simple and page-friendly</td><td>Often unnecessary</td></tr><tr><td>Large changing feed</td><td>Can shift or become expensive</td><td>Usually more stable</td></tr><tr><td>Jump to page 17</td><td>Natural</td><td>Not naturally supported</td></tr><tr><td>Stable ordering</td><td>Still required for deterministic results</td><td>Required to define the cursor position</td></tr></tbody></table></TradeoffTable>
    <LessonCallout variant="tradeoff"><p>Cursor pagination is not automatically superior. Product navigation, data-store access patterns, mutation rate, and ordering requirements decide the fit.</p></LessonCallout>
    <PracticeConnections ids={["news-feed", "search-engine", "chat-system"]} />
    <FurtherReading items={networkingSources.pagination} />
    <RememberThis><p>Use offsets when simple page navigation matters and the result set is manageable. Use cursors for large or frequently changing ordered collections, with an explicit stable sort and unique tiebreaker.</p></RememberThis>
  </>;
}

export function IdempotentApisLessonContent() {
  return <>
    <LessonHeading level={2} id="uncertain-outcome">A timeout does not tell the client whether the write happened</LessonHeading>
    <p>A payment client sends a create request, the server commits it, and the response is lost. Retrying is necessary for reliability, but repeating the business operation could charge twice.</p>
    <pre><code>{`POST /payments
Idempotency-Key: 7f92...`}</code></pre>
    <MermaidDiagram chart={idempotencyFlow} title="Retry after an uncertain payment response" description="The first payment succeeds but its response is lost. The client retries with the same key, the API finds the stored outcome, and returns it without creating another payment." />

    <LessonHeading level={2} id="server-enforcement">The server must enforce the key</LessonHeading>
    <p>Bind the key to a caller and a normalized request identity. Atomically establish one operation, retain its outcome for a documented period, and return the same result for a valid duplicate. Reject reuse with incompatible parameters.</p>
    <p>Concurrent duplicates need one winner or a shared in-progress state. Retention must cover the client&apos;s retry window without keeping keys forever. The business transition itself still needs constraints; a header cannot magically make arbitrary logic idempotent.</p>
    <LessonCallout variant="common-mistake"><p>Checking for a key and then creating the payment in two uncoordinated steps leaves a race. Explain the atomic boundary, not only the key format.</p></LessonCallout>

    <InterviewFollowUps><ul><li>What is stored before the operation finishes?</li><li>How do concurrent requests with the same key behave?</li><li>What if the key is reused with a different amount?</li><li>How long is an outcome retained?</li><li>Which downstream side effects also need deduplication?</li></ul></InterviewFollowUps>
    <p>Later, the canonical <Link href="/system-design/patterns/idempotency">Reliability Idempotency lesson</Link> goes deeper into state transitions and side effects.</p>
    <PracticeConnections ids={["payment-system", "ticketmaster", "job-scheduler", "webhook-delivery"]} />
    <FurtherReading items={networkingSources["idempotent-apis"]} />
    <RememberThis><p>Retries are unavoidable when outcomes are uncertain. An idempotency key works only when the server binds it to request identity, coordinates concurrent duplicates, and replays the stored outcome without repeating the business operation.</p></RememberThis>
  </>;
}

export function GrpcLessonContent() {
  return <>
    <LessonHeading level={2} id="typed-remote-call">gRPC makes a remote call look like a typed service method</LessonHeading>
    <pre><code>{`service UserService {
  rpc GetUser(GetUserRequest) returns (User);
}`}</code></pre>
    <p>A <code>.proto</code> service definition describes methods and messages. Tooling generates client and server code, Protocol Buffers provide a binary wire representation, and gRPC commonly uses HTTP/2 for concurrent calls and streaming.</p>
    <p>Calls can be unary, server-streaming, client-streaming, or bidirectional streaming. Streams are useful for a long-lived logical flow, but add lifecycle, deadline, load-balancing, and failure-handling questions.</p>

    <LessonHeading level={2} id="rest-vs-grpc">Choose from the consumers and operating environment</LessonHeading>
    <TradeoffTable><table><thead><tr><th>Requirement</th><th>REST</th><th>gRPC</th></tr></thead><tbody><tr><td>Public web API</td><td>Often a strong fit</td><td>Less direct</td></tr><tr><td>Internal service calls</td><td>Good</td><td>Often a strong fit</td></tr><tr><td>Human-readable payload</td><td>Commonly JSON</td><td>Usually binary</td></tr><tr><td>Streaming</td><td>Possible through several mechanisms</td><td>Native RPC patterns</td></tr><tr><td>Browser support</td><td>Excellent</td><td>Additional considerations</td></tr><tr><td>Strict contract</td><td>Schema-dependent</td><td>Strong interface definition</td></tr></tbody></table></TradeoffTable>
    <p>Generated contracts improve consistency but make schema evolution and tooling part of the platform. Binary payloads are not as convenient to inspect manually. A small internal CRUD application may be better served by familiar HTTP JSON rather than adding another protocol.</p>
    <PracticeConnections ids={["metrics-platform", "api-gateway-system", "ml-inference-service"]} />
    <FurtherReading items={networkingSources.grpc} />
    <RememberThis><p>gRPC is strongest when typed internal contracts, code generation, efficient payloads, or streaming justify its operational cost. REST and gRPC solve overlapping problems; neither wins without requirements.</p></RememberThis>
  </>;
}

export function GraphqlLessonContent() {
  return <>
    <LessonHeading level={2} id="client-selected-data">GraphQL lets the client select fields from a typed schema</LessonHeading>
    <pre><code>{`query {
  user(id: "42") {
    name
    posts { title }
  }
}`}</code></pre>
    <p>A schema defines available types and fields. Queries read, mutations request changes, and a single endpoint is conventional. A frontend can retrieve related data shaped for one screen, reducing some over-fetching and under-fetching.</p>

    <LessonHeading level={2} id="resolver-cost">Flexible queries move complexity to execution</LessonHeading>
    <p>Each field resolves data and enforces authorization. Naively loading posts once per user creates an N+1 access pattern. Batching, request-scoped loaders, and deliberate data access can reduce that cost, but the server must still bound depth, breadth, and total query complexity.</p>
    <ul><li>Authorization may be required per resource or field, not only at the endpoint.</li><li>Arbitrary query shapes complicate cache keys and cost prediction.</li><li>Resolvers can hide slow fan-out unless tracing shows the field-level work.</li><li>Schema evolution needs ownership even when clients select their fields.</li></ul>

    <LessonHeading level={2} id="rest-vs-graphql">REST vs GraphQL is a product boundary decision</LessonHeading>
    <p>GraphQL can fit complex, rapidly changing frontend data needs across related resources. REST can fit simple resource APIs, public contracts, conventional HTTP caching, and teams that value operational simplicity. GraphQL does not replace REST, and a straightforward CRUD application may not benefit from it.</p>
    <LessonCallout variant="common-mistake"><p>GraphQL prevents neither N+1 queries nor unauthorized field access. The schema describes capabilities; resolvers and policy must execute them safely.</p></LessonCallout>
    <PracticeConnections ids={["news-feed", "ecommerce", "collaborative-app"]} />
    <FurtherReading items={networkingSources.graphql} />
    <RememberThis><p>GraphQL trades a flexible client-selected graph for more complex execution, authorization, caching, and cost control. Choose it when those costs solve real frontend data problems.</p></RememberThis>
  </>;
}
