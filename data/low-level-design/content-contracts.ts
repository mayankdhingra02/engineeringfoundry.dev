export type LowLevelDesignLessonContract = Readonly<{
  interviewDecision: string;
  mentalModel: string;
  useCases: readonly string[];
  nonGoals: readonly string[];
  domainExample: string;
  badDesign: string;
  betterDesign: string;
  interfaceSketch: Readonly<{ language: string; code: string }>;
  representativeFlow: readonly string[];
  testCases: readonly string[];
  evolutionFollowUp: string;
  concurrencyNote: string;
  systemDesignBoundary: string;
  levelExpectations: Readonly<Record<"Entry" | "Mid" | "Senior" | "Staff+", string>>;
  practiceSlug: string;
}>;

export const lowLevelDesignRubric = [
  {
    id: "scope-control",
    title: "Requirement and scope control",
    prompt: "Did the design start from explicit actors, use cases, constraints, and non-goals?",
    revisit: "The model starts before the primary behavior or boundary is clear.",
    developing: "The main use case is clear, but important constraints or non-goals remain implicit.",
    evident: "The design is driven by a bounded primary flow and revises scope when new evidence appears.",
  },
  {
    id: "domain-modeling",
    title: "Domain modeling",
    prompt: "Do the concepts represent identity, values, state, and business rules instead of every noun?",
    revisit: "The model is a class inventory or mirrors storage without explaining domain meaning.",
    developing: "Most concepts are useful, but identities, values, or relationships need sharper boundaries.",
    evident: "Entities, values, and relationships form a small vocabulary that supports the required behavior.",
  },
  {
    id: "responsibility-ownership",
    title: "Responsibility and ownership",
    prompt: "Is there one understandable owner for each decision, mutation, and invariant?",
    revisit: "State is mutated from many places or one god service owns unrelated behavior.",
    developing: "Primary ownership is visible, but one or two transitions or policies remain misplaced.",
    evident: "Responsibilities are cohesive and lifecycle ownership is explicit at every important boundary.",
  },
  {
    id: "interfaces-dependencies",
    title: "Interface and dependency design",
    prompt: "Are operations shaped by caller needs and dependencies directed toward stable contracts?",
    revisit: "Interfaces expose implementation detail or add abstraction without a caller or change force.",
    developing: "The main operations are usable, but dependency direction or error contracts need refinement.",
    evident: "Small interfaces make the primary flow clear and isolate genuine policy or integration boundaries.",
  },
  {
    id: "state-invariants",
    title: "State and invariant correctness",
    prompt: "Are legal states, transitions, and always-true conditions explicit and protected?",
    revisit: "Boolean combinations or public mutation allow illegal intermediate states.",
    developing: "The happy-path lifecycle works, but a transition or failure can still violate an invariant.",
    evident: "State changes are guarded by the owner and failures leave the model in a valid condition.",
  },
  {
    id: "flow-validation",
    title: "Representative-flow validation",
    prompt: "Was one end-to-end use case traced through calls, state changes, outputs, and a failure?",
    revisit: "The answer stops at boxes or types and never demonstrates connected behavior.",
    developing: "The happy path is traceable, but an important failure or state change is skipped.",
    evident: "A concrete walkthrough validates collaboration, state, output, and one boundary case.",
  },
  {
    id: "pattern-judgment",
    title: "Appropriate pattern use",
    prompt: "Does every named pattern answer a concrete variation, integration, lifecycle, or event pressure?",
    revisit: "Patterns are selected from memory before the problem establishes a need.",
    developing: "Most abstractions are justified, but one pattern adds more indirection than value.",
    evident: "The direct design comes first; patterns appear only where a named change force earns them.",
  },
  {
    id: "concurrency-judgment",
    title: "Concurrency judgment",
    prompt: "Where relevant, is the shared state, harmful interleaving, and atomic owner named precisely?",
    revisit: "The design ignores a natural race or adds locks everywhere without identifying one.",
    developing: "The race is recognized, but the serialization or atomicity boundary is vague.",
    evident: "Concurrency is addressed proportionately at the invariant owner and omitted when it is not relevant.",
  },
  {
    id: "errors-idempotency",
    title: "Error and idempotency handling",
    prompt: "Do failure results, unchanged state, retries, and duplicate commands have explicit semantics?",
    revisit: "Generic exceptions or partial mutation make failure behavior unknowable.",
    developing: "Common errors are named, but retry or duplicate behavior remains ambiguous.",
    evident: "Callers can distinguish failures, retry safely where appropriate, and rely on preserved invariants.",
  },
  {
    id: "testability",
    title: "Testability",
    prompt: "Can tests observe behavior and replace only genuinely external or variable collaborators?",
    revisit: "Tests would need real infrastructure or mock every internal class.",
    developing: "The main use case is testable, but time, policy, or failure seams are still implicit.",
    evident: "Deterministic contracts support happy-path, failure, invariant, and evolution tests.",
  },
  {
    id: "evolution",
    title: "Extensibility and evolution",
    prompt: "Does a follow-up change the smallest responsible boundary without speculative generality?",
    revisit: "The design either collapses under one change or pre-builds abstractions for imagined futures.",
    developing: "The follow-up is accommodated, but the affected responsibility or trade-off is not explicit.",
    evident: "The changed assumption, owning boundary, stable contract, and new cost are all explained.",
  },
  {
    id: "communication",
    title: "Communication and trade-offs",
    prompt: "Are decisions, alternatives, uncertainty, and deliberate omissions easy to follow?",
    revisit: "Names and diagrams appear without the reasoning that connects them to requirements.",
    developing: "The approach is understandable, but alternatives or stopping decisions are under-explained.",
    evident: "The candidate narrates a coherent flow, compares defensible choices, and closes with clear boundaries.",
  },
] as const;

export type LowLevelDesignRubricId = (typeof lowLevelDesignRubric)[number]["id"];

export type LowLevelDesignPracticeContract = Readonly<{
  domainModel: readonly string[];
  responsibilities: readonly string[];
  interfaces: readonly Readonly<{ signature: string; purpose: string }>[];
  stateAndInvariants: readonly string[];
  representativeFlow: readonly string[];
  errorHandling: readonly string[];
  concurrency: Readonly<{ relevant: boolean; note: string }>;
  testingStrategy: readonly string[];
  alternatives: readonly Readonly<{ title: string; useWhen: string; tradeoff: string }>[];
  rubricEmphasis: readonly LowLevelDesignRubricId[];
}>;

const expectations = (
  entry: string,
  mid: string,
  senior: string,
  staff: string,
): LowLevelDesignLessonContract["levelExpectations"] => ({ Entry: entry, Mid: mid, Senior: senior, "Staff+": staff });

export const lowLevelDesignLessonContractsBySlug: Readonly<Record<string, LowLevelDesignLessonContract>> = {
  "interview-approach": {
    interviewDecision: "Choose the smallest reasoning sequence that makes the requested behavior and evaluation artifact visible before naming classes.",
    mentalModel: "An LLD answer is a revisable behavioral model: requirements create responsibilities; responsibilities create interfaces and state; a walkthrough tests the result.",
    useCases: ["Turn an ambiguous object-design prompt into one primary flow.", "Confirm whether the interviewer wants interfaces, pseudocode, code, or a diagram.", "Revise a boundary when a follow-up changes an assumption."],
    nonGoals: ["Producing a complete production architecture.", "Demonstrating every design pattern you remember."],
    domainExample: "For a delivery workflow, schedule one delivery, change its status, and explain who owns each transition before adding carriers, routing, or notifications.",
    badDesign: "A candidate opens with Factory, Observer, and ten class names. The interviewer still cannot tell which use case the design supports or which object protects delivery state.",
    betterDesign: "Start with schedule and transition commands, give Delivery the lifecycle invariant, and let a coordinator invoke it. Add an integration boundary only when the carrier requirement appears.",
    interfaceSketch: { language: "TypeScript", code: "interface DeliveryWorkflow {\n  schedule(input: ScheduleDelivery): Result<Delivery, ScheduleError>;\n  transition(id: DeliveryId, next: DeliveryState): Result<Delivery, TransitionError>;\n}" },
    representativeFlow: ["Clarify that scheduling and status transition are the primary behaviors.", "Create a Delivery in scheduled state through the workflow boundary.", "Ask Delivery to validate and apply a transition.", "Return a typed result and explain what stayed unchanged on failure."],
    testCases: ["Scheduling with valid input returns a delivery in the agreed initial state.", "An illegal transition returns a domain error and leaves state unchanged.", "A new carrier requirement changes an adapter boundary, not Delivery lifecycle rules."],
    evolutionFollowUp: "Add rescheduling after dispatch; identify whether the existing lifecycle owner can support it or whether a scheduling policy must be extracted.",
    concurrencyNote: "Discuss concurrency only if two commands can change the same delivery revision; name an atomic transition boundary instead of adding locks to every object.",
    systemDesignBoundary: "Queues, replicated tracking stores, routing fleets, and cross-region availability belong in System Design after the in-process contract is coherent.",
    levelExpectations: expectations("Complete one clear flow with sensible ownership.", "Explain error contracts and one justified seam.", "Control ambiguity, concurrency relevance, and follow-up evolution.", "Clarify organizational and system ownership without adding speculative classes."),
    practiceSlug: "package-delivery-lifecycle",
  },
  "requirements-use-cases": {
    interviewDecision: "Ask only questions whose answers change behavior, ownership, state, or the expected artifact.",
    mentalModel: "Requirements are executable stories with actors, commands, queries, outcomes, and non-goals—not a feature wish list.",
    useCases: ["Bound parking entry and exit behavior.", "Separate elevator rider requests from maintenance behavior.", "Identify notification preference and delivery-result requirements."],
    nonGoals: ["Enumerating every future feature.", "Treating quality attributes as generic words with no object-level consequence."],
    domainExample: "A vending purchase requires selection, sufficient payment, inventory availability, dispense, and change; remote fleet management remains outside the core.",
    badDesign: "A vending machine supports cash, cards, loyalty, promotions, remote restocking, telemetry, and refunds before the first purchase flow is agreed.",
    betterDesign: "Agree on one cash purchase and cancellation flow, state the inventory and money invariants, and record card settlement as an external boundary.",
    interfaceSketch: { language: "TypeScript", code: "interface VendingSession {\n  insert(money: Money): Balance;\n  select(slot: SlotId): Result<Purchase, PurchaseError>;\n  cancel(): Refund;\n}" },
    representativeFlow: ["Name the customer and one purchase goal.", "Confirm payment, inventory, cancellation, and change boundaries.", "Translate the story into commands and observable results.", "Record remote operations and settlement as non-goals."],
    testCases: ["An unavailable item is rejected without changing balance or inventory.", "Cancellation returns the deposited amount.", "A card-payment follow-up changes the payment boundary without rewriting selection rules."],
    evolutionFollowUp: "Add exact-change requirements and explain which command result and money policy change.",
    concurrencyNote: "Inventory races are relevant only if multiple sessions can reserve the same slot; otherwise keep the first model single-session and say so.",
    systemDesignBoundary: "Fleet telemetry, remote inventory synchronization, and payment networks are architecture concerns, not reasons to expand the object model prematurely.",
    levelExpectations: expectations("State actors, main commands, and non-goals.", "Connect constraints to interfaces and failures.", "Prioritize ambiguous requirements and expose hidden invariants.", "Set boundaries across product, component, and external-system ownership."),
    practiceSlug: "vending-workflow",
  },
  "domain-models": {
    interviewDecision: "Keep a concept only when identity, value semantics, lifecycle, or behavior makes it necessary to the primary use case.",
    mentalModel: "The domain model is a working language for rules; it is neither a database schema nor a list of nouns from the prompt.",
    useCases: ["Distinguish a parking spot from the ticket that records occupancy.", "Represent a time range as a value with overlap behavior.", "Keep delivery outcomes separate from package identity."],
    nonGoals: ["Mirroring tables and foreign keys.", "Giving every input field its own class."],
    domainExample: "A reservation has identity and lifecycle; a TimeRange is an immutable value; a RoomCalendar owns the collection whose overlap rule must remain true.",
    badDesign: "One Scheduler object stores raw room IDs, date strings, users, and status flags, then exposes its arrays for callers to edit.",
    betterDesign: "Use TimeRange to validate intervals, Reservation to own lifecycle, and RoomCalendar to protect confirmed non-overlap.",
    interfaceSketch: { language: "TypeScript", code: "type ReserveResult = Reservation | Conflict;\ninterface RoomCalendar {\n  reserve(request: ReservationRequest): ReserveResult;\n  cancel(id: ReservationId): Result<void, CancelError>;\n}" },
    representativeFlow: ["Create a validated TimeRange value.", "Ask RoomCalendar to reserve it.", "Check overlap against confirmed reservations.", "Return a Reservation or Conflict without exposing the internal collection."],
    testCases: ["Invalid or inverted time ranges cannot be created.", "Adjacent reservations do not overlap.", "A conflicting reservation is rejected and the calendar remains unchanged."],
    evolutionFollowUp: "Add equipment requirements and decide whether they belong on Room, ReservationRequest, or a selection policy.",
    concurrencyNote: "Two simultaneous reservations matter because they can violate the same calendar invariant; the atomic reserve operation belongs at that owner.",
    systemDesignBoundary: "Database indexes and multi-office replication can enforce or distribute the rule later; first define the domain rule and its owner.",
    levelExpectations: expectations("Name essential entities and values.", "Explain identity, lifecycle, and relationships.", "Use counterexamples to refine aggregate and invariant boundaries.", "Separate domain ownership from storage and organizational ownership."),
    practiceSlug: "meeting-room-scheduler",
  },
  "responsibilities-ownership": {
    interviewDecision: "Place each decision and state change with the smallest component that has the information and authority to protect its invariant.",
    mentalModel: "Responsibility answers who decides, who mutates, who coordinates, and who observes; class names come after those answers.",
    useCases: ["Keep elevator movement safety inside each car.", "Let a dispatcher choose a car without controlling its doors.", "Separate package transition rules from courier assignment coordination."],
    nonGoals: ["Creating one service for every verb.", "Forcing all behavior into entities when a cross-entity coordinator is clearer."],
    domainExample: "ElevatorCar owns doors, direction, and legal movement; Dispatcher owns car selection; DispatchPolicy owns a replaceable selection rule only when policies vary.",
    badDesign: "A BuildingController reads and writes every car field, schedules stops, opens doors, and calculates selection scores.",
    betterDesign: "Dispatcher selects; ElevatorCar accepts or rejects a stop and owns its safe transition state; optional DispatchPolicy isolates selection variation.",
    interfaceSketch: { language: "TypeScript", code: "interface ElevatorCar {\n  snapshot(): CarSnapshot;\n  requestStop(floor: Floor): Result<void, CarStateError>;\n}\ninterface DispatchPolicy { choose(request: HallRequest, cars: readonly CarSnapshot[]): CarId | null; }" },
    representativeFlow: ["Dispatcher receives a hall request.", "Policy selects from read-only car snapshots.", "The selected ElevatorCar validates and accepts the stop.", "The car owns door-close, movement, arrival, and door-open transitions."],
    testCases: ["Dispatcher cannot make a car move with open doors.", "A car rejects an invalid floor without changing its queue.", "A new policy can be tested against the same snapshots."],
    evolutionFollowUp: "Add maintenance mode and show why the car owns eligibility while the dispatcher filters candidates.",
    concurrencyNote: "Simultaneous requests may compete for a car; address atomic acceptance at the car rather than promising a globally optimal schedule.",
    systemDesignBoundary: "Building-wide event transport, device networks, and real-time control certification sit outside this interview-scale object model.",
    levelExpectations: expectations("Assign clear owners for movement and selection.", "Separate policy from coordination when variation is real.", "Explain race, failure, and lifecycle boundaries.", "Frame safety, hardware, and organizational boundaries without pretending to certify a control system."),
    practiceSlug: "elevator-dispatch",
  },
  "relationships-interfaces": {
    interviewDecision: "Choose composition, references, inheritance, and ports from lifecycle, substitution, and caller needs rather than diagram aesthetics.",
    mentalModel: "An interface is a behavioral promise at a useful boundary; a relationship explains ownership, cardinality, and lifecycle.",
    useCases: ["Translate provider-specific notification results.", "Keep pricing policy replaceable only when rules vary.", "Express caller-shaped repository or clock seams."],
    nonGoals: ["Adding an interface to every class.", "Using inheritance only to reuse fields."],
    domainExample: "NotificationService depends on a DeliveryChannel contract; EmailChannel adapts a provider; DeliveryResult shields callers from provider exceptions.",
    badDesign: "Notification inherits from EmailNotification and SmsNotification while application code catches provider exceptions directly.",
    betterDesign: "Notification is content; DeliveryChannel is a capability; channel adapters translate external results into a stable DeliveryResult.",
    interfaceSketch: { language: "TypeScript", code: "interface DeliveryChannel {\n  send(message: Notification): Promise<DeliveryResult>;\n}\ntype DeliveryResult = { kind: 'delivered'; receipt: string } | { kind: 'retryable' | 'rejected'; reason: string };" },
    representativeFlow: ["Resolve a permitted channel from recipient preferences.", "Send through the caller-shaped DeliveryChannel contract.", "Translate the provider response into DeliveryResult.", "Return the stable result without leaking SDK types."],
    testCases: ["A disabled channel is rejected before provider invocation.", "A provider timeout becomes retryable rather than delivered.", "A fake channel verifies message content without network access."],
    evolutionFollowUp: "Add push notifications and identify which adapter is new and which public contract remains stable.",
    concurrencyNote: "Interface design alone does not solve duplicate sends; if retries are in scope, expose an idempotency key at the orchestration boundary.",
    systemDesignBoundary: "Queues, provider failover, global rate limiting, and delivery storage belong in System Design once their contracts affect this component.",
    levelExpectations: expectations("Define usable operations and simple composition.", "Explain dependency direction and error translation.", "Balance stable contracts against channel-specific capability.", "Clarify platform versus product ownership and avoid flattening every provider into a lowest-common-denominator interface."),
    practiceSlug: "notification-orchestrator",
  },
  "state-lifecycle-errors": {
    interviewDecision: "Represent only behavior-changing state, define legal transitions, and make failure leave the model valid and explainable.",
    mentalModel: "State is a controlled lifecycle; invariants are the conditions every successful operation must preserve; errors are part of the interface.",
    useCases: ["Protect vending inventory and money through purchase failure.", "Prevent delivered packages from returning to in-transit.", "Reject overlapping confirmed reservations."],
    nonGoals: ["Recording every historical event as a boolean.", "Building a generic state-machine framework for a small lifecycle."],
    domainExample: "A PurchaseSession progresses from collecting money to selected, dispensed, completed, or cancelled while inventory changes only during a successful guarded purchase.",
    badDesign: "Selection decrements inventory, payment may fail later, and cancellation tries to reconstruct what should be restored.",
    betterDesign: "Validate selection and funds first, then commit dispense and inventory together; typed failures preserve the prior state.",
    interfaceSketch: { language: "TypeScript", code: "type PurchaseResult = Dispensed | OutOfStock | InsufficientFunds;\ninterface PurchaseSession {\n  select(slot: SlotId): PurchaseResult;\n  cancel(): Refund;\n}" },
    representativeFlow: ["Accept money into the active session.", "Validate slot and available inventory.", "Validate funds and compute change.", "Atomically dispense, decrement inventory, and complete the session."],
    testCases: ["Out-of-stock leaves money and inventory unchanged.", "Successful purchase decrements exactly one item and returns exact change.", "A completed session rejects another selection."],
    evolutionFollowUp: "Add card authorization with a pending outcome and explain how it changes lifecycle and cancellation semantics.",
    concurrencyNote: "A race is natural only if multiple sessions can claim one slot; protect the inventory mutation at the owning machine or inventory boundary.",
    systemDesignBoundary: "Payment networks, remote inventory, and durable event history are outside the in-process lifecycle unless explicitly requested.",
    levelExpectations: expectations("Name states, legal transitions, and basic failures.", "Protect invariants and define atomic changes.", "Handle retries, idempotency, and concurrency proportionately.", "Explain external failure ownership and operational implications without turning the answer into distributed architecture."),
    practiceSlug: "vending-workflow",
  },
  "selective-patterns": {
    interviewDecision: "Name a pattern only after identifying the concrete change force or mismatch it solves and the cost it introduces.",
    mentalModel: "Patterns are vocabulary for earned boundaries, not ingredients in a correct answer.",
    useCases: ["Strategy for genuinely variable dispatch or pricing policy.", "Adapter for a provider contract mismatch.", "State objects only when state-specific behavior outgrows guarded transitions."],
    nonGoals: ["Covering the Gang of Four catalog.", "Predicting speculative extension points."],
    domainExample: "A notification sender begins as one direct channel; email and SMS provider mismatches later earn adapters, while variable selection policy may earn Strategy.",
    badDesign: "Every entity gets a Factory, every collection gets a Repository, and every event gets Observer before there is construction complexity, persistence, or an independent subscriber.",
    betterDesign: "Keep the first flow direct, state the pressure that would trigger extraction, and preserve the caller contract when refactoring.",
    interfaceSketch: { language: "TypeScript", code: "interface PricingPolicy {\n  fee(ticket: ClosedTicket, at: Instant): Money;\n}\n// Keep one FeeCalculator until pricing truly varies." },
    representativeFlow: ["Implement the direct use case.", "Introduce a follow-up that creates real variation or mismatch.", "Extract the smallest stable boundary.", "Compare the new indirection cost with the expected change frequency."],
    testCases: ["The direct implementation still passes before extraction.", "Two real policy variants satisfy the same behavior contract.", "Removing the variation would make the abstraction unnecessary."],
    evolutionFollowUp: "Add a second pricing regime and explain why Strategy is now earned but Factory or Observer still is not.",
    concurrencyNote: "Patterns do not imply thread safety; name concurrency only when the underlying state and interleaving make it relevant.",
    systemDesignBoundary: "Repository, Adapter, or Command may expose an architectural boundary, but storage topology and distributed execution remain System Design concerns.",
    levelExpectations: expectations("Prefer direct composition and explain one pattern simply.", "Tie abstraction to a concrete variation.", "Compare refactoring, coupling, and failure-boundary costs.", "Explain when the pattern belongs to a platform or organizational boundary rather than the local model."),
    practiceSlug: "parking-allocation",
  },
  "concurrency-testability-evolution": {
    interviewDecision: "Locate the shared invariant, create observable seams, and evolve the smallest owning boundary when a requirement changes.",
    mentalModel: "Concurrency, testability, and evolution are three stress tests of responsibility placement—not reasons to add infrastructure everywhere.",
    useCases: ["Serialize two reservations for one room.", "Inject time for pricing tests.", "Add recurring reservations without replacing conflict ownership."],
    nonGoals: ["Teaching lock-free algorithms or operating-system internals.", "Mocking every internal object."],
    domainExample: "RoomCalendar exposes one atomic reserve operation, Clock is replaceable for deterministic tests, and RecurrencePolicy expands requests while overlap stays with the calendar.",
    badDesign: "Every class has a lock and interface, tests mirror implementation calls, and a recurrence follow-up rewrites the scheduler.",
    betterDesign: "Protect the shared reservation invariant at RoomCalendar, isolate only time and policy variability, and keep overlap checking stable through the follow-up.",
    interfaceSketch: { language: "TypeScript", code: "interface Clock { now(): Instant; }\ninterface AtomicCalendar {\n  reserve(request: ReservationRequest): Promise<Reservation | Conflict>;\n}" },
    representativeFlow: ["Two callers submit the same TimeRange.", "RoomCalendar serializes the invariant check and insert.", "One receives Reservation and one receives Conflict.", "A deterministic test controls time and asserts the final calendar."],
    testCases: ["Concurrent requests cannot both confirm the same room and range.", "A fake clock makes expiration deterministic.", "Adding recurrence reuses the same single-reservation conflict rule."],
    evolutionFollowUp: "Add a waitlist and decide whether it reacts to cancellation or becomes part of the calendar transaction.",
    concurrencyNote: "Name the harmful interleaving and atomic owner. Do not specify locks, transactions, or queues beyond the detail the interviewer requests.",
    systemDesignBoundary: "Cross-process locking, database isolation, messaging, and multi-region reservations belong to System Design after the object-level contract is explicit.",
    levelExpectations: expectations("Recognize a concrete race and write behavior tests.", "Choose useful seams and preserve invariants under failure.", "Explain atomicity, idempotency, and targeted evolution.", "Frame consistency and ownership across component, platform, and organization boundaries."),
    practiceSlug: "meeting-room-scheduler",
  },
};

export const lowLevelDesignPracticeContractsBySlug: Readonly<Record<string, LowLevelDesignPracticeContract>> = {
  "parking-allocation": {
    domainModel: ["ParkingFacility coordinates one facility; ParkingSpot owns occupancy and category.", "Ticket has identity and an active → paid → closed lifecycle.", "Vehicle carries category; Money and time inputs are values, not mutable entities."],
    responsibilities: ["ParkingFacility selects a suitable spot and coordinates entry/exit.", "ParkingSpot alone changes its occupancy.", "Ticket protects exit lifecycle; PricingPolicy calculates a fee only because pricing can vary."],
    interfaces: [{ signature: "enter(vehicle): Ticket | NoSpot", purpose: "Allocate and occupy one suitable spot as one operation." }, { signature: "exit(ticketId, payment): Receipt | ExitError", purpose: "Validate, price, pay, close, and release without partial success." }],
    stateAndInvariants: ["An occupied spot has exactly one active ticket.", "A ticket refers to one spot and closes at most once.", "A spot is released only after a successful exit outcome."],
    representativeFlow: ["Find a compatible available spot.", "Atomically occupy it and issue an active ticket.", "At exit, validate ticket state and calculate the fee.", "On successful payment, close the ticket and release the spot."],
    errorHandling: ["NoSpot and UnknownTicket are explicit results that change no state.", "Duplicate exit returns AlreadyClosed; it never charges or releases twice.", "Payment failure keeps the ticket active and the spot occupied."],
    concurrency: { relevant: true, note: "Two arrivals can claim the same spot; selection plus occupation must be atomic at the facility/spot ownership boundary." },
    testingStrategy: ["Test category matching and no-capacity behavior.", "Test failed payment preserves ticket and spot state.", "Race two entries for one spot and assert exactly one active ticket."],
    alternatives: [{ title: "Facility-owned selection", useWhen: "One small facility has a stable allocation rule.", tradeoff: "Fewer abstractions, but policy growth can crowd the coordinator." }, { title: "Allocation Strategy", useWhen: "Priority, distance, reservation, or accessibility rules vary independently.", tradeoff: "Policy is replaceable, but adds indirection before variation is proven." }],
    rubricEmphasis: ["responsibility-ownership", "state-invariants", "pattern-judgment", "concurrency-judgment"],
  },
  "elevator-dispatch": {
    domainModel: ["ElevatorCar owns direction, door state, current floor, and accepted stops.", "HallRequest describes origin and direction; Dispatcher assigns it.", "DispatchPolicy reads snapshots and recommends a car without driving it."],
    responsibilities: ["ElevatorCar guards safe movement and door transitions.", "Dispatcher coordinates requests and selection.", "DispatchPolicy owns a replaceable ranking rule when multiple policies are required."],
    interfaces: [{ signature: "dispatch(request): Assignment | NoCar", purpose: "Choose and ask one eligible car to accept the request." }, { signature: "car.requestStop(floor): Result<void, CarStateError>", purpose: "Keep stop acceptance and safety with the car." }],
    stateAndInvariants: ["A moving car has closed doors.", "A maintenance car accepts no passenger request.", "Every accepted stop is within the building floor range."],
    representativeFlow: ["Receive a hall request.", "Read eligible car snapshots and select one with the current policy.", "Ask that car to accept the floor.", "The car closes doors, moves, arrives, stops, and opens safely."],
    errorHandling: ["No eligible car returns NoCar without losing the request.", "Invalid floors are rejected before entering a car queue.", "A car that changes to maintenance can reject the assignment so Dispatcher retries selection."],
    concurrency: { relevant: true, note: "Simultaneous requests can select one stale snapshot; car-level atomic acceptance prevents duplicate or unsafe assignment." },
    testingStrategy: ["Table-test legal and illegal movement/door transitions.", "Use fixed snapshots to test dispatch policies deterministically.", "Simulate car rejection after selection and verify bounded reselection."],
    alternatives: [{ title: "Nearest eligible car", useWhen: "The interview asks for a simple explainable first policy.", tradeoff: "Easy to test but can produce poor direction and load behavior." }, { title: "Directional scoring policy", useWhen: "Waiting time and current direction are explicit requirements.", tradeoff: "Better choices require more state and careful tie-breaking." }],
    rubricEmphasis: ["responsibility-ownership", "state-invariants", "concurrency-judgment", "communication"],
  },
  "notification-orchestrator": {
    domainModel: ["Notification contains content and purpose; RecipientPreference controls permitted channels.", "DeliveryChannel represents a capability; channel adapters translate providers.", "DeliveryResult records delivered, retryable, or rejected outcomes."],
    responsibilities: ["NotificationService selects permitted delivery and coordinates one attempt.", "Each channel adapter owns provider translation.", "A retry policy, if required, owns retry eligibility rather than provider exceptions."],
    interfaces: [{ signature: "send(notification, recipient): DeliveryResult", purpose: "Resolve preference, invoke one channel, and return stable semantics." }, { signature: "channel.deliver(message, idempotencyKey): DeliveryResult", purpose: "Hide provider-specific request and error shapes." }],
    stateAndInvariants: ["A disabled channel is never invoked.", "Delivered is returned only with provider-confirmed success.", "The same idempotency key represents the same logical send."],
    representativeFlow: ["Load recipient channel preferences.", "Select an enabled channel with the current policy.", "Adapt and send the message with an idempotency key.", "Translate the provider response into a stable DeliveryResult."],
    errorHandling: ["Invalid recipient or disabled channel is rejected before provider work.", "Timeout becomes retryable, not delivered.", "Duplicate command reuses its key so a retry cannot create an unbounded second send."],
    concurrency: { relevant: true, note: "Retries and simultaneous commands can duplicate delivery; idempotency belongs at the orchestration/provider boundary." },
    testingStrategy: ["Use fake channels for delivered, retryable, and rejected outcomes.", "Assert disabled preferences make no provider call.", "Replay one idempotency key and verify one logical delivery."],
    alternatives: [{ title: "Direct channel map", useWhen: "A few stable channels share simple selection.", tradeoff: "Very clear, but conditional logic grows as policy varies." }, { title: "Selection Strategy plus adapters", useWhen: "Channel policy and provider contracts change independently.", tradeoff: "Separates change forces at the cost of more explicit types." }],
    rubricEmphasis: ["interfaces-dependencies", "pattern-judgment", "errors-idempotency", "testability"],
  },
  "vending-workflow": {
    domainModel: ["VendingMachine owns slots and starts one PurchaseSession per customer interaction.", "InventorySlot owns item quantity; Money is an exact value.", "PurchaseSession owns deposited money, selection, and terminal outcome."],
    responsibilities: ["PurchaseSession validates money and selection state.", "VendingMachine coordinates the guarded inventory mutation and dispense result.", "PaymentMethod is introduced only when cash and card behavior genuinely differ."],
    interfaces: [{ signature: "session.insert(money): Balance", purpose: "Accumulate exact value without exposing mutable totals." }, { signature: "session.purchase(slot): Dispensed | PurchaseError", purpose: "Validate and commit inventory/money changes together." }, { signature: "session.cancel(): Refund", purpose: "Return funds only while the session is cancellable." }],
    stateAndInvariants: ["Inventory never drops below zero.", "A completed or cancelled session accepts no further purchase.", "Failed purchase leaves inventory and deposited money unchanged."],
    representativeFlow: ["Insert money into an active session.", "Select a slot and validate stock and price.", "Commit decrement, dispense, and change as one guarded operation.", "Mark the session completed and return the result."],
    errorHandling: ["OutOfStock and InsufficientFunds preserve all prior state.", "DispenseFailure restores or never commits inventory.", "Duplicate purchase on a terminal session returns SessionClosed."],
    concurrency: { relevant: false, note: "For one physical machine with one active purchase lane, serialize sessions and state that assumption. Discuss a race only if the prompt allows simultaneous lanes." },
    testingStrategy: ["Test exact and excess payment including returned change.", "Inject dispense failure and assert inventory is preserved.", "Test every legal and illegal session transition."],
    alternatives: [{ title: "Enum and guarded methods", useWhen: "The lifecycle is small and behaviors remain compact.", tradeoff: "Lowest explanation cost, but conditionals grow with many state-specific actions." }, { title: "State objects", useWhen: "Each state gains substantial distinct behavior and transitions.", tradeoff: "Localizes behavior but adds objects and transition plumbing." }],
    rubricEmphasis: ["scope-control", "state-invariants", "errors-idempotency", "testability"],
  },
  "meeting-room-scheduler": {
    domainModel: ["Room has capacity/equipment; TimeRange is an immutable value.", "Reservation has identity and lifecycle; RoomCalendar owns confirmed reservations.", "Scheduler coordinates room search and a selection policy."],
    responsibilities: ["RoomCalendar protects non-overlap for one room.", "Scheduler chooses among rooms and coordinates reservation creation.", "RoomSelectionPolicy owns preference only when selection criteria vary."],
    interfaces: [{ signature: "findAndReserve(request): Reservation | NoRoom", purpose: "Coordinate search and one atomic calendar reservation." }, { signature: "calendar.reserve(request): Reservation | Conflict", purpose: "Keep overlap validation and insertion with the invariant owner." }],
    stateAndInvariants: ["Confirmed reservations for one room never overlap.", "A cancelled reservation no longer blocks its time range.", "Every reservation refers to exactly one room and valid TimeRange."],
    representativeFlow: ["Validate the requested TimeRange and capacity.", "Find candidate rooms and apply the current selection rule.", "Ask one RoomCalendar to reserve atomically.", "Return Reservation or continue bounded selection after Conflict."],
    errorHandling: ["InvalidRange and UnauthorizedCancellation do not mutate calendars.", "A race conflict triggers bounded reselection, not silent overwrite.", "Repeated cancellation returns AlreadyCancelled without another side effect."],
    concurrency: { relevant: true, note: "Two callers can observe the same room as free; conflict check and reservation insert must be atomic at RoomCalendar." },
    testingStrategy: ["Property-test overlap and adjacency for TimeRange.", "Race two reservations for the same room and assert one Conflict.", "Add recurrence and reuse the single-reservation invariant tests."],
    alternatives: [{ title: "Calendar-owned reservation", useWhen: "The non-overlap rule is the dominant invariant.", tradeoff: "Strong local protection; multi-room coordination stays outside the calendar." }, { title: "Central reservation coordinator", useWhen: "One request must atomically reserve multiple resources.", tradeoff: "Supports cross-resource rules but concentrates more responsibility." }],
    rubricEmphasis: ["domain-modeling", "state-invariants", "concurrency-judgment", "evolution"],
  },
  "package-delivery-lifecycle": {
    domainModel: ["Package owns identity and legal delivery lifecycle.", "DeliveryAssignment links a courier to an active assignment period.", "DeliveryOutcome preserves delivered or failed evidence without erasing history."],
    responsibilities: ["Package validates lifecycle transitions.", "DispatchService coordinates assignment and reassignment.", "TransitionPolicy is extracted only if product rules vary by package or service."],
    interfaces: [{ signature: "assign(packageId, courierId): Assignment | AssignError", purpose: "Create one active assignment through a guarded boundary." }, { signature: "transition(packageId, command): Package | TransitionError", purpose: "Apply an auditable intent while preserving lifecycle rules." }],
    stateAndInvariants: ["Delivered is terminal.", "A package has at most one active courier assignment.", "Failed delivery retains a reason before rescheduling."],
    representativeFlow: ["Create a package in ready state.", "Assign one courier and transition to assigned.", "Record pickup and transition to in-transit.", "Record delivered or failed outcome; reschedule only from failed."],
    errorHandling: ["Stale assignment acceptance returns Conflict.", "Illegal transitions return the current state and make no mutation.", "Duplicate delivery command is idempotent when it carries the same command ID."],
    concurrency: { relevant: true, note: "Two couriers can accept the same package; assignment creation must compare or serialize against the current active assignment." },
    testingStrategy: ["Table-test every permitted and forbidden transition.", "Race two assignments and assert at most one active assignment.", "Verify failed outcome history survives rescheduling."],
    alternatives: [{ title: "Entity-owned transition table", useWhen: "One stable lifecycle applies to every package.", tradeoff: "Rules remain visible, but entity code grows as variants accumulate." }, { title: "Transition Policy or Command handlers", useWhen: "Service tiers or auditable deferred commands vary materially.", tradeoff: "Variation and intent are explicit, but orchestration becomes more complex." }],
    rubricEmphasis: ["responsibility-ownership", "state-invariants", "errors-idempotency", "evolution"],
  },
};
