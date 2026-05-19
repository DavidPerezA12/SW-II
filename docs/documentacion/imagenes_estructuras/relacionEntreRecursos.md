```mermaid
graph TD

    Games[games]

    Reviews[reviews]
    Developers[developers]
    Countries[countries]

    Games -->|gameId| Reviews
    Games -->|gameId| Developers
    Games -->|gameId| Countries
```