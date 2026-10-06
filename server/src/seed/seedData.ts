export const INITIAL_SUBJECTS = [
  {
    _id: 'subj-java',
    name: 'Java',
    description:
      'Object-oriented programming, JVM internals, collections framework, generics, multithreading, and modern Java concurrency.',
    category: 'Programming Languages',
    difficulty: 'Intermediate',
    icon: 'Code2',
  },
  {
    _id: 'subj-dsa',
    name: 'Data Structures & Algorithms',
    description:
      'Asymptotic analysis, trees, graphs, heaps, hashing, dynamic programming, greedy paradigms, and algorithmic problem solving.',
    category: 'Core Computer Science',
    difficulty: 'Advanced',
    icon: 'GitBranch',
  },
  {
    _id: 'subj-dbms',
    name: 'DBMS',
    description:
      'Relational algebra, SQL optimization, functional dependencies, normalization (1NF–BCNF), ACID transactions, and B+ Tree indexing.',
    category: 'Data Systems',
    difficulty: 'Intermediate',
    icon: 'Database',
  },
  {
    _id: 'subj-os',
    name: 'Operating Systems',
    description:
      'Process scheduling, kernel threads, synchronization primitives, deadlock prevention, virtual memory paging, and file systems.',
    category: 'Systems Engineering',
    difficulty: 'Advanced',
    icon: 'Cpu',
  },
  {
    _id: 'subj-cn',
    name: 'Computer Networks',
    description:
      'OSI & TCP/IP protocol suites, subnetting, routing algorithms (OSPF, BGP), congestion control, TLS security, and HTTP/3.',
    category: 'Systems Engineering',
    difficulty: 'Intermediate',
    icon: 'Network',
  },
  {
    _id: 'subj-web',
    name: 'Web Development',
    description:
      'Modern full-stack architecture, React rendering patterns, REST & GraphQL APIs, authentication security, and cloud deployment.',
    category: 'Software Development',
    difficulty: 'Beginner',
    icon: 'Globe',
  },
  {
    _id: 'subj-se',
    name: 'Software Engineering',
    description:
      'System architecture, SOLID design principles, design patterns, CI/CD pipelines, automated testing strategies, and Agile delivery.',
    category: 'Software Development',
    difficulty: 'Intermediate',
    icon: 'Layers',
  },
  {
    _id: 'subj-ai',
    name: 'Artificial Intelligence',
    description:
      'Search heuristics, probabilistic reasoning, machine learning foundations, transformer architectures, embeddings, and RAG systems.',
    category: 'Intelligence & Data',
    difficulty: 'Advanced',
    icon: 'BrainCircuit',
  },
];

export const INITIAL_TOPICS = [
  // JAVA
  {
    _id: 'top-java-1',
    subject: 'Java',
    name: 'JVM Architecture & Memory Model',
    description: 'ClassLoader subsystem, Heap generations (Young, Old, Metaspace), Thread stacks, and Garbage Collection algorithms (G1GC, ZGC).',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Basic Java Syntax'],
    keyConcepts: ['ClassLoader Hierarchy', 'Heap vs Stack', 'Garbage Collection Roots', 'Stop-The-World Pauses'],
    contentSummary: 'Explains how Java bytecode is loaded, verified, JIT-compiled, and managed across heap memory generations.',
  },
  {
    _id: 'top-java-2',
    subject: 'Java',
    name: 'OOP Pillar Contracts, Interfaces & Abstract Classes',
    description: 'Encapsulation, dynamic polymorphism, method dispatch tables (vtables), sealed classes, and composition over inheritance.',
    difficulty: 'Beginner',
    estimatedStudyTime: 40,
    prerequisites: [],
    keyConcepts: ['Dynamic Method Dispatch', 'Interface Default Methods', 'Liskov Substitution', 'Immutability'],
    contentSummary: 'Covers core object-oriented design rules and runtime polymorphism in Java.',
  },
  {
    _id: 'top-java-3',
    subject: 'Java',
    name: 'Java Collections Framework & HashMap Internals',
    description: 'Internal bucket structure of HashMap, hash collisions, red-black treeify threshold (Java 8+), ConcurrentHashMap, and Comparable vs Comparator.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 60,
    prerequisites: ['OOP Pillar Contracts, Interfaces & Abstract Classes'],
    keyConcepts: ['Hash Code Contract', 'Load Factor & Rehashing', 'TreeNode Threshold', 'Fail-Fast Iterators'],
    contentSummary: 'Deep dive into O(1) vs O(log n) bucket lookup mechanics and thread-safe collection alternatives.',
  },
  {
    _id: 'top-java-4',
    subject: 'Java',
    name: 'Multithreading, Locks & CompletableFuture',
    description: 'Thread lifecycle, volatile visibility, synchronized monitors, ReentrantLock, ExecutorService thread pools, and Virtual Threads.',
    difficulty: 'Advanced',
    estimatedStudyTime: 65,
    prerequisites: ['JVM Architecture & Memory Model'],
    keyConcepts: ['Happens-Before Guarantee', 'CAS Atomic Operations', 'ThreadPoolExecutor', 'CompletableFuture Pipelines'],
    contentSummary: 'Covers safe concurrent programming, lock contention reduction, and asynchronous non-blocking workflows.',
  },

  // DSA
  {
    _id: 'top-dsa-1',
    subject: 'Data Structures & Algorithms',
    name: 'Trees, Binary Search Trees & AVL Rotations',
    description: 'Tree traversals, BST height invariants, self-balancing AVL & Red-Black trees, Lowest Common Ancestor, and Trie prefix trees.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 60,
    prerequisites: ['Recursion & Pointers'],
    keyConcepts: ['Inorder Traversal Sort Property', 'Balance Factor', 'LL/RR/LR/RL Rotations', 'Prefix Trie Nodes'],
    contentSummary: 'Guaranteed O(log N) search, insertion, and deletion through structural tree balancing.',
  },
  {
    _id: 'top-dsa-2',
    subject: 'Data Structures & Algorithms',
    name: 'Graph Algorithms: BFS, DFS, Dijkstra & Topological Sort',
    description: 'Adjacency representations, connected components, cycle detection, shortest paths (Dijkstra, Bellman-Ford), and Minimum Spanning Trees.',
    difficulty: 'Advanced',
    estimatedStudyTime: 75,
    prerequisites: ['Trees, Binary Search Trees & AVL Rotations'],
    keyConcepts: ['Kahn Topological Sort', 'Edge Relaxation', 'PriorityQueue Dijkstra', 'Union-Find Disjoint Sets'],
    contentSummary: 'Systematic graph exploration and optimal pathfinding over weighted and unweighted networks.',
  },
  {
    _id: 'top-dsa-3',
    subject: 'Data Structures & Algorithms',
    name: 'Dynamic Programming: Memoization & Tabulation',
    description: 'Overlapping subproblems, optimal substructure, 0/1 Knapsack, Longest Common Subsequence, state compression, and DAG DP.',
    difficulty: 'Advanced',
    estimatedStudyTime: 80,
    prerequisites: ['Recursion & Asymptotic Complexity'],
    keyConcepts: ['State Transition Recurrence', 'Top-Down Memoization', 'Bottom-Up Tabulation', 'Space Optimization'],
    contentSummary: 'Transforming exponential recursive search into polynomial-time dynamic programming solutions.',
  },
  {
    _id: 'top-dsa-4',
    subject: 'Data Structures & Algorithms',
    name: 'Sliding Window, Two Pointers & Monotonic Stacks',
    description: 'Linear-time subarray optimization, variable-length sliding windows, and next-greater-element monotonic queues/stacks.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Arrays & Hashing'],
    keyConcepts: ['Window Invariant Maintenance', 'Amortized O(N) Stack Push/Pop', 'Two-Pointer Convergence'],
    contentSummary: 'High-yield algorithmic patterns for reducing nested O(N^2) loops to O(N) time complexity.',
  },

  // DBMS
  {
    _id: 'top-dbms-1',
    subject: 'DBMS',
    name: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
    description: 'Functional dependencies, Armstrong axioms, candidate key discovery, update/insert/delete anomalies, and lossless-join decomposition.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 55,
    prerequisites: ['Relational Model Basics'],
    keyConcepts: ['Partial Dependency (2NF)', 'Transitive Dependency (3NF)', 'Superkey Determinant (BCNF)', 'Dependency Preservation'],
    contentSummary: 'Eliminating data redundancy and relational anomalies through formal schema refinement.',
  },
  {
    _id: 'top-dbms-2',
    subject: 'DBMS',
    name: 'Transactions, ACID Properties & Concurrency Control',
    description: 'Atomicity, Consistency, Isolation, Durability, serializability conflict graphs, Two-Phase Locking (2PL), and MVCC snapshot isolation.',
    difficulty: 'Advanced',
    estimatedStudyTime: 65,
    prerequisites: ['Database Normalization (1NF, 2NF, 3NF, BCNF)'],
    keyConcepts: ['Conflict Serializability', 'Strict 2PL', 'Dirty/Phantom Reads', 'Write-Ahead Logging (WAL)'],
    contentSummary: 'Ensuring transactional integrity under concurrent read/write database workloads.',
  },
  {
    _id: 'top-dbms-3',
    subject: 'DBMS',
    name: 'B+ Tree Indexing & Query Execution Plans',
    description: 'Clustered vs non-clustered indexes, B+ Tree node fanout, leaf sibling pointers, hash indexes, and cost-based query optimization.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Relational Model Basics'],
    keyConcepts: ['B+ Tree Leaf Chaining', 'Index Selectivity', 'Covering Index', 'Hash Join vs Merge Join'],
    contentSummary: 'Minimizing disk I/O block accesses for range and point queries using B+ Trees.',
  },
  {
    _id: 'top-dbms-4',
    subject: 'DBMS',
    name: 'SQL Joins, Window Functions & Query Tuning',
    description: 'Inner/Outer/Cross joins, correlated subqueries, CTEs, PARTITION BY window ranking, and execution plan EXPLAIN analysis.',
    difficulty: 'Beginner',
    estimatedStudyTime: 45,
    prerequisites: [],
    keyConcepts: ['ROW_NUMBER & RANK', 'Common Table Expressions', 'Predicate Pushdown', 'SARGable Queries'],
    contentSummary: 'Writing expressive, high-performance analytical and transactional SQL queries.',
  },

  // OPERATING SYSTEMS
  {
    _id: 'top-os-1',
    subject: 'Operating Systems',
    name: 'CPU Scheduling & Context Switching',
    description: 'Preemptive vs non-preemptive scheduling, FCFS, SJF/SRTF, Round Robin time quanta, Multilevel Feedback Queues, and PCB state saving.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Process Lifecycle'],
    keyConcepts: ['Turnaround vs Waiting Time', 'Convoy Effect', 'Starvation & Aging', 'TLB Flush Overhead'],
    contentSummary: 'Balancing CPU throughput, fairness, and interactive response latency.',
  },
  {
    _id: 'top-os-2',
    subject: 'Operating Systems',
    name: 'Process Synchronization, Semaphores & Deadlocks',
    description: 'Critical section problem, mutex locks, counting semaphores, Producer-Consumer, Coffman deadlock conditions, and Banker algorithm.',
    difficulty: 'Advanced',
    estimatedStudyTime: 65,
    prerequisites: ['CPU Scheduling & Context Switching'],
    keyConcepts: ['Mutual Exclusion', 'Hold and Wait', 'Circular Wait', 'Safe State Sequence'],
    contentSummary: 'Coordinating concurrent processes without race conditions or resource deadlocks.',
  },
  {
    _id: 'top-os-3',
    subject: 'Operating Systems',
    name: 'Virtual Memory, Paging & Page Replacement',
    description: 'Multi-level page tables, Translation Lookaside Buffer (TLB) hit ratio, demand paging, page faults, LRU/Optimal/Clock algorithms, and thrashing.',
    difficulty: 'Advanced',
    estimatedStudyTime: 60,
    prerequisites: ['Memory Hierarchy'],
    keyConcepts: ['Effective Access Time (EAT)', 'Belady Anomaly', 'Working Set Model', 'Copy-on-Write'],
    contentSummary: 'Decoupling logical address spaces from physical RAM frames via hardware MMU translation.',
  },
  {
    _id: 'top-os-4',
    subject: 'Operating Systems',
    name: 'File System Internals, Inodes & Disk Scheduling',
    description: 'Virtual File System (VFS), UNIX inode direct/indirect pointers, journaling crash recovery, and SCAN/C-SCAN/NVMe scheduling.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 45,
    prerequisites: [],
    keyConcepts: ['Inode Metadata Table', 'Hard vs Symbolic Links', 'Metadata Journaling'],
    contentSummary: 'Persistent storage organization, directory resolution, and crash-consistent file operations.',
  },

  // COMPUTER NETWORKS
  {
    _id: 'top-cn-1',
    subject: 'Computer Networks',
    name: 'TCP vs UDP, 3-Way Handshake & Congestion Control',
    description: 'SYN/SYN-ACK/ACK connection establishment, sliding window flow control, Slow Start, AIMD congestion avoidance, and Fast Retransmit.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 55,
    prerequisites: ['OSI Model Overview'],
    keyConcepts: ['Sequence & Ack Numbers', 'Receive Window (rwnd)', 'Congestion Window (cwnd)', 'TIME_WAIT State'],
    contentSummary: 'Reliable, ordered byte-stream delivery over unreliable IP packet networks.',
  },
  {
    _id: 'top-cn-2',
    subject: 'Computer Networks',
    name: 'IPv4/IPv6 Addressing, CIDR Subnetting & NAT',
    description: 'Classless Inter-Domain Routing prefix masks, subnet calculation, longest prefix matching, ARP resolution, and Network Address Translation.',
    difficulty: 'Beginner',
    estimatedStudyTime: 45,
    prerequisites: [],
    keyConcepts: ['Subnet Mask Bitwise AND', 'Longest Prefix Match', 'NAT Port Mapping', 'DHCP DORA Flow'],
    contentSummary: 'Hierarchical packet addressing, subnet partitioning, and local-to-global routing.',
  },
  {
    _id: 'top-cn-3',
    subject: 'Computer Networks',
    name: 'Routing Protocols: Distance Vector vs Link State',
    description: 'Bellman-Ford Distance Vector (RIP, Count-to-Infinity), Dijkstra Link State (OSPF), and inter-domain Border Gateway Protocol (BGP).',
    difficulty: 'Advanced',
    estimatedStudyTime: 60,
    prerequisites: ['IPv4/IPv6 Addressing, CIDR Subnetting & NAT'],
    keyConcepts: ['Link State Advertisements', 'Split Horizon with Poison Reverse', 'Autonomous Systems (BGP)'],
    contentSummary: 'Distributed routing table convergence across enterprise and internet-scale topologies.',
  },
  {
    _id: 'top-cn-4',
    subject: 'Computer Networks',
    name: 'DNS Resolution, TLS 1.3 Handshake & HTTP/2–HTTP/3',
    description: 'Recursive vs authoritative DNS queries, asymmetric/symmetric TLS key exchange, stream multiplexing, and QUIC over UDP.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['TCP vs UDP, 3-Way Handshake & Congestion Control'],
    keyConcepts: ['ECDHE Forward Secrecy', 'Head-of-Line Blocking', 'QUIC 0-RTT Connection'],
    contentSummary: 'End-to-end lifecycle of a modern secure web request from domain lookup to encrypted transport.',
  },

  // WEB DEVELOPMENT
  {
    _id: 'top-web-1',
    subject: 'Web Development',
    name: 'React Rendering Lifecycle, Hooks & State Architecture',
    description: 'Virtual DOM reconciliation, Fiber work loop, useEffect dependency invariants, memoization, and server vs client state separation.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['JavaScript ES6+ & Closures'],
    keyConcepts: ['Stale Closure Prevention', 'Render vs Commit Phase', 'Context Splitting'],
    contentSummary: 'Building predictable, high-frame-rate user interfaces with modern React.',
  },
  {
    _id: 'top-web-2',
    subject: 'Web Development',
    name: 'RESTful API Design, JWT Auth & Express Middleware',
    description: 'Idempotent HTTP methods, status codes, stateless JWT verification, role-based access control, rate limiting, and centralized error handling.',
    difficulty: 'Beginner',
    estimatedStudyTime: 45,
    prerequisites: [],
    keyConcepts: ['Stateless Bearer Tokens', 'Middleware Pipeline', 'CORS Preflight', 'Input Sanitization'],
    contentSummary: 'Architecting secure, modular Node.js and Express backend services.',
  },
  {
    _id: 'top-web-3',
    subject: 'Web Development',
    name: 'Web Security: XSS, CSRF, Injection & Content Security Policy',
    description: 'Cross-Site Scripting defenses, SameSite cookie attributes, NoSQL/SQL parameterized queries, and OWASP Top 10 mitigation.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['RESTful API Design, JWT Auth & Express Middleware'],
    keyConcepts: ['Output Encoding', 'Bcrypt Salt Rounds', 'MongoDB Operator Stripping'],
    contentSummary: 'Hardening full-stack web applications against common exploitation vectors.',
  },
  {
    _id: 'top-web-4',
    subject: 'Web Development',
    name: 'Frontend Performance, Code Splitting & Web Vitals',
    description: 'Largest Contentful Paint (LCP), Interaction to Next Paint (INP), route lazy loading, asset compression, and caching headers.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 40,
    prerequisites: ['React Rendering Lifecycle, Hooks & State Architecture'],
    keyConcepts: ['Dynamic Import Bundles', 'Critical Rendering Path', 'Stale-While-Revalidate'],
    contentSummary: 'Optimizing bundle delivery and runtime responsiveness for production web apps.',
  },

  // SOFTWARE ENGINEERING
  {
    _id: 'top-se-1',
    subject: 'Software Engineering',
    name: 'SOLID Principles & Clean Architecture',
    description: 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion, and domain-driven boundaries.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Object-Oriented Programming'],
    keyConcepts: ['Dependency Injection', 'High Cohesion & Low Coupling', 'Port and Adapter Pattern'],
    contentSummary: 'Structuring software systems that remain testable and adaptable as requirements evolve.',
  },
  {
    _id: 'top-se-2',
    subject: 'Software Engineering',
    name: 'Gang of Four Design Patterns in Production',
    description: 'Creational (Factory, Builder, Singleton), Structural (Adapter, Decorator, Facade), and Behavioral (Strategy, Observer, Command) patterns.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 55,
    prerequisites: ['SOLID Principles & Clean Architecture'],
    keyConcepts: ['Strategy Runtime Swapping', 'Observer Event Pub/Sub', 'Decorator Wrapping'],
    contentSummary: 'Reusable architectural solutions to recurring object collaboration problems.',
  },
  {
    _id: 'top-se-3',
    subject: 'Software Engineering',
    name: 'Testing Pyramid: Unit, Integration & E2E Verification',
    description: 'Test-Driven Development (TDD), deterministic mocking, API contract integration testing, and regression automation in CI pipelines.',
    difficulty: 'Beginner',
    estimatedStudyTime: 40,
    prerequisites: [],
    keyConcepts: ['Arrange-Act-Assert', 'Test Doubles & Stubs', 'Deterministic Fixtures'],
    contentSummary: 'Building high-confidence automated test suites that catch regressions early.',
  },
  {
    _id: 'top-se-4',
    subject: 'Software Engineering',
    name: 'System Design: Scalability, Caching & Load Balancing',
    description: 'Horizontal scaling, consistent hashing, Redis cache-aside vs write-through, message queues, and rate limiting algorithms (Token Bucket).',
    difficulty: 'Advanced',
    estimatedStudyTime: 70,
    prerequisites: ['RESTful API Design, JWT Auth & Express Middleware'],
    keyConcepts: ['CAP Theorem Trade-offs', 'Consistent Hashing Ring', 'Cache Stampede Mitigation'],
    contentSummary: 'Designing distributed architectures capable of handling high-throughput production traffic.',
  },

  // ARTIFICIAL INTELLIGENCE
  {
    _id: 'top-ai-1',
    subject: 'Artificial Intelligence',
    name: 'Retrieval-Augmented Generation (RAG) & Vector Embeddings',
    description: 'Document chunking strategies, high-dimensional semantic embeddings, cosine similarity search, context grounding, and hallucination prevention.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 55,
    prerequisites: ['Linear Algebra Basics'],
    keyConcepts: ['Chunk Overlap Window', 'Cosine Similarity Metric', 'Grounded Citation Prompting'],
    contentSummary: 'Connecting Large Language Models to authoritative private knowledge bases with verifiable citations.',
  },
  {
    _id: 'top-ai-2',
    subject: 'Artificial Intelligence',
    name: 'Transformer Architecture & Self-Attention',
    description: 'Tokenization, positional encoding, Query-Key-Value scaled dot-product attention, multi-head attention, and autoregressive decoding.',
    difficulty: 'Advanced',
    estimatedStudyTime: 70,
    prerequisites: ['Matrix Multiplication & Probability'],
    keyConcepts: ['Scaled Dot-Product Attention', 'Softmax Temperature', 'Context Window Complexity O(N^2)'],
    contentSummary: 'Mathematical and architectural foundations of modern foundation models.',
  },
  {
    _id: 'top-ai-3',
    subject: 'Artificial Intelligence',
    name: 'Search Algorithms: A*, Minimax & Alpha-Beta Pruning',
    description: 'Uninformed vs heuristic search, admissible and consistent heuristics in A*, adversarial game trees, and alpha-beta branch pruning.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 50,
    prerequisites: ['Graph Algorithms: BFS, DFS, Dijkstra & Topological Sort'],
    keyConcepts: ['Admissible Heuristic h(n) <= h*(n)', 'Evaluation Function', 'Alpha-Beta Cutoff'],
    contentSummary: 'Classical symbolic AI search and optimal decision-making under constraints.',
  },
  {
    _id: 'top-ai-4',
    subject: 'Artificial Intelligence',
    name: 'Supervised Learning, Loss Functions & Regularization',
    description: 'Gradient descent optimization, bias-variance trade-off, cross-entropy loss, L1/L2 regularization, and precision-recall evaluation.',
    difficulty: 'Intermediate',
    estimatedStudyTime: 60,
    prerequisites: [],
    keyConcepts: ['Overfitting vs Underfitting', 'Stochastic Gradient Descent', 'F1-Score & ROC-AUC'],
    contentSummary: 'Core principles of training generalizable machine learning models from labeled data.',
  },
];

export const SAMPLE_DBMS_DOCUMENT_TEXT = `DATABASE MANAGEMENT SYSTEMS (DBMS) — NORMALIZATION & INDEXING REFERENCE GUIDE
[Page 1]
1. INTRODUCTION TO DATABASE NORMALIZATION
Database normalization is a systematic process of organizing relational database schemas to minimize data redundancy and eliminate undesirable characteristics such as Insertion, Update, and Deletion anomalies.
- Insertion Anomaly: Inability to insert valid data about an entity without the presence of another attribute (for example, cannot record a new department until at least one student enrolls).
- Deletion Anomaly: Unintended loss of critical information when deleting a tuple (for example, deleting the last student in a course also deletes the course details).
- Update Anomaly: Partial updates across duplicated rows leading to inconsistent data states.

Functional Dependency (FD): Let X and Y be subsets of attributes of relation R. A functional dependency X -> Y holds if whenever two tuples agree on attributes X, they must also agree on attributes Y.

[Page 2]
2. NORMAL FORMS HIERARCHY (1NF, 2NF, 3NF, BCNF)
First Normal Form (1NF):
A relation is in 1NF if every attribute contains only atomic (indivisible) values and there are no repeating groups or multi-valued attributes.

Second Normal Form (2NF):
A relation is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the ENTIRE candidate key (no partial dependencies on a proper subset of a composite candidate key).

Third Normal Form (3NF):
A relation is in 3NF if it is in 2NF and contains no transitive dependencies of non-prime attributes on any candidate key. Formally, for every non-trivial FD X -> A, either X is a superkey OR A is a prime attribute (part of some candidate key).

Boyce-Codd Normal Form (BCNF):
A stricter version of 3NF. A relation R is in BCNF if for every non-trivial functional dependency X -> Y, X MUST be a superkey of R. BCNF eliminates all redundancy based on functional dependencies, though it may occasionally sacrifice dependency preservation.

[Page 3]
3. LOSSLESS-JOIN DECOMPOSITION & B+ TREE INDEXING
Lossless-Join Property:
When decomposing relation R into R1 and R2, the decomposition is lossless if and only if the common attributes (R1 intersect R2) form a superkey for either R1 or R2.

B+ Tree Indexing in DBMS:
A B+ Tree is a self-balancing multi-way search tree optimized for block-based disk reads:
1. Internal nodes store only routing keys and child block pointers (maximizing fanout and minimizing tree height).
2. All actual data records (or record pointers) reside in the Leaf Nodes at the same depth level.
3. Leaf nodes are linked sequentially via sibling pointers, enabling fast O(log N + K) range queries (e.g., WHERE salary BETWEEN 50000 AND 90000).`;
