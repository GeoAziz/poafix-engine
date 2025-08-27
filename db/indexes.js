// Create indexes
db.clients.createIndex({ "status": 1 });
db.providers.createIndex({ "status": 1 });
db.clients.createIndex({ "blockedAt": 1 });
db.providers.createIndex({ "suspendedAt": 1 });

// Create validation rules
db.createCollection("clients", {
   validator: {
      $jsonSchema: {
         required: ["status"],
         properties: {
            status: {
               enum: ["active", "blocked"]
            }
         }
      }
   }
});

db.createCollection("providers", {
   validator: {
      $jsonSchema: {
         required: ["status"],
         properties: {
            status: {
               enum: ["active", "suspended"]
            }
         }
      }
   }
});
