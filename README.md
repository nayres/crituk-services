# Crituk

Crituk is a fun side project that will allow users to post and share reviews of shows they're enjoying. As an excersize, I'll be jumping straight into a scalable, distributed architecture leveraging AWS offerings.

### Technical Requirements

- Users can create an account, and personalize their profile.
- Users can post and share reviews of shows they are watching.
  - Show title
  - Streaming platform
  - Rating
  - Brief review
- Users can search users by username.
- Users can follow other users, and view their profile/ feed.
- Users can create or join a household or group.

**Future Requirements**

- Users can search for shows.
- Users can share their review on social platforms.

### Non-technical Requirements

- Intuitive and Empathetic User Experience

  - Ensure the system design prioritizes a user-friendly interface that addresses diverse user needs, encouraging engagement and satisfaction.

- Scalability

  - Design to scale effectively to support millions of users without performance degradation, employing horizontal scaling and distributed architectures where needed.

- Fault and Partition Tolerance

  - Build resilience into the system to handle faults and network partitions gracefully, ensuring minimal disruption to users.

- Prioritization of System Availability Over Data Consistency

  - Follow an _AP-first (Availability-Partition tolerance)_ approach as per the CAP theorem, allowing minor inconsistencies in data that resolve within ~5 minutes during high-load scenarios or partial failures.

- Low Latency Under High Load
  - Maintain response times that meet user expectations even under peak traffic, leveraging caching, efficient algorithms, and distributed load handling.

## Codebase

**Why use a monorepo?**

I chose to colocate my services and UI to make them more discoverable as a portfolio project. One significant tradeoff is that most available monorepo tooling lacks support for multiple languages. Initially, I was hoping to use Go, Python, Java, and TypeScript to showcase my abilities.

**Why NX?**

I chose to use NX because it's a great tool to manage monorepos, and will remove the friction of building tooling that doesn't deliver immediate value. It also has great support for Node, and React, and React Native.
