# Bug Report: customContent Persistence Issue

## Problem Summary

The `customContent.contact` fields are being saved correctly via RPC function, but when reading back from the database, old/stale data is returned instead of the newly saved values.

## Terminal Logs (Lines 774-1012)

```
📝 customContent update requested: {
  "events": {
    "title": "",
    "enabled": false,
    "formFields": [],
    "description": ""
  },
  "contact": {
    "enabled": true,
    "phone": "0507816577",
    "email": "45678harelhalperin5@gmail.com",
    "whatsapp": "23456",
    "instagram": "12345",
    "facebook": "12345"
  },
  "loyaltyClub": {
    "enabled": true
  },
  "menuButtonImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s",
  "reviews": {
    "title": "",
    "enabled": true,
    "description": "",
    "googleReviewsUrl": "gftyuiop["
  }
}

📝 customContent cleaned for save: {
  "events": {
    "title": "",
    "enabled": false,
    "formFields": [],
    "description": ""
  },
  "contact": {
    "enabled": true,
    "phone": "0507816577",
    "email": "45678harelhalperin5@gmail.com",
    "whatsapp": "23456",
    "instagram": "12345",
    "facebook": "12345"
  },
  "loyaltyClub": {
    "enabled": true
  },
  "menuButtonImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s",
  "reviews": {
    "title": "",
    "enabled": true,
    "description": "",
    "googleReviewsUrl": "gftyuiop["
  }
}

💾 Saving customContent via RPC function: {
  "events": {
    "title": "",
    "enabled": false,
    "formFields": [],
    "description": ""
  },
  "contact": {
    "enabled": true,
    "phone": "0507816577",
    "email": "45678harelhalperin5@gmail.com",
    "whatsapp": "23456",
    "instagram": "12345",
    "facebook": "12345"
  },
  "loyaltyClub": {
    "enabled": true
  },
  "menuButtonImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s",
  "reviews": {
    "title": "",
    "enabled": true,
    "description": "",
    "googleReviewsUrl": "gftyuiop["
  }
}

✅ RPC function succeeded! {
  returnedCustomContent: {
    events: { title: '', enabled: false, formFields: [], description: '' },
    contact: {
      email: '45678harelhalperin5@gmail.com',
      phone: '0507816577',
      enabled: true,
      facebook: '12345',
      whatsapp: '23456',
      instagram: '12345'
    },
    reviews: {
      title: '',
      enabled: true,
      description: '',
      googleReviewsUrl: 'gftyuiop['
    },
    loyaltyClub: { enabled: true },
    menuButtonImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s'
  },
  contact: {
    email: '45678harelhalperin5@gmail.com',
    phone: '0507816577',
    enabled: true,
    facebook: '12345',
    whatsapp: '23456',
    instagram: '12345'
  }
}

🔍 RPC verification: {
  phone: { expected: '0507816577', saved: '0507816577', match: true },
  email: {
    expected: '45678harelhalperin5@gmail.com',
    saved: '45678harelhalperin5@gmail.com',
    match: true
  },
  whatsapp: { expected: '23456', saved: '23456', match: true },
  instagram: { expected: '12345', saved: '12345', match: true },
  facebook: { expected: '12345', saved: '12345', match: true }
}

PUT /api/business/update 200 in 1961ms
GET /dashboard 200 in 204ms
GET /api/auth/me 200 in 1559ms
GET /api/auth/me 200 in 21ms

🔍 RPC function returned customContent: {
  "events": {
    "title": "",
    "enabled": false,
    "formFields": [],
    "description": ""
  },
  "contact": {
    "email": "harelhalperin5@gmail.com",  // ❌ OLD DATA - should be "45678harelhalperin5@gmail.com"
    "phone": "0507816577",
    "enabled": true,
    "facebook": "",  // ❌ OLD DATA - should be "12345"
    "whatsapp": "0507816577",  // ❌ OLD DATA - should be "23456"
    "instagram": "עfhuiגכענ"  // ❌ OLD DATA - should be "12345"
  },
  "reviews": {
    "title": "",
    "enabled": true,
    "description": "",
    "googleReviewsUrl": "gftyuiop["
  },
  "loyaltyClub": {
    "enabled": true
  },
  "menuButtonImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s"
}

📥 API: Raw business data from DB: {
  hasCustomContent: true,
  hasCustomcontent: false,
  customContentType: 'object',
  contact: {
    email: 'harelhalperin5@gmail.com',  // ❌ OLD DATA
    phone: '0507816577',
    enabled: true,
    facebook: '',  // ❌ OLD DATA
    whatsapp: '0507816577',  // ❌ OLD DATA
    instagram: 'עfhuiגכענ'  // ❌ OLD DATA
  },
  phone: '0507816577',
  phoneLength: 10,
  whatsapp: '0507816577',
  whatsappLength: 10,
  email: 'harelhalperin5@gmail.com',
  emailLength: 24,
  instagram: 'עfhuiגכענ',
  instagramLength: 9,
  instagramBytes: 14,
  facebook: undefined,
  facebookLength: undefined,
  customContentJson: '{"events":{"title":"","enabled":false,"formFields":[],"description":""},"contact":{"email":"harelhalperin5@gmail.com","phone":"0507816577","enabled":true,"facebook":"","whatsapp":"0507816577","instagram":"עfhuiגכענ"},"reviews":{"title":"","enabled":true,"description":"","googleReviewsUrl":"gftyuiop["},"loyaltyClub":{"enabled":true},"menuButtonImageUrl":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhpSMEdlhb81oub21jw1uO1yPyQW3u8IG_Eg&s"}'
}

📥 API: Cleaned customContent (customContent.contact is source of truth): {
  contact: {
    enabled: true,
    phone: '0507816577',
    email: 'harelhalperin5@gmail.com',  // ❌ OLD DATA
    whatsapp: '0507816577',  // ❌ OLD DATA
    instagram: 'עfhuiגכענ',  // ❌ OLD DATA
    facebook: ''  // ❌ OLD DATA
  },
  phone: '0507816577',
  whatsapp: '0507816577',
  email: 'harelhalperin5@gmail.com',
  instagram: 'עfhuiגכענ',
  facebook: '',
  usingFallback: false
}

GET /api/business/info?businessId=7f551d3e-f048-48cf-8ce2-53973a378ded&_t=1767226404002 200 in 2230ms
```

## Key Observations

1. **Save Operation (PUT /api/business/update):**

   - ✅ Data sent correctly: `email: "45678harelhalperin5@gmail.com"`, `whatsapp: "23456"`, `instagram: "12345"`, `facebook: "12345"`
   - ✅ RPC function `update_business_custom_content` reports success
   - ✅ RPC verification shows all fields match expected values
   - ✅ Response returns correct data from RPC

2. **Read Operation (GET /api/business/info):**

   - ❌ RPC function `get_custom_content` returns OLD data:
     - `email: "harelhalperin5@gmail.com"` (should be `"45678harelhalperin5@gmail.com"`)
     - `whatsapp: "0507816577"` (should be `"23456"`)
     - `instagram: "עfhuiגכענ"` (should be `"12345"`)
     - `facebook: ""` (should be `"12345"`)

3. **The Problem:**
   - The `update_business_custom_content` RPC function appears to save correctly (verification passes)
   - But `get_custom_content` RPC function returns stale/old data
   - This suggests either:
     - Transaction isolation issue (read happens before commit)
     - Database trigger/constraint modifying the data
     - Caching issue in PostgreSQL
     - The update is not actually being committed

## Code Files

### 1. app/api/business/update/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      name,
      nameEn,
      logoUrl,
      type,
      template,
      menuStyle,
      aiInstructions,
      businessHours,
      menuOnlyMessage,
      customContent,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { message: "businessId is required" },
        { status: 400 }
      );
    }

    // Get current business to update subscription
    const { data: currentBusiness, error: fetchError } = await supabaseAdmin
      .from("businesses")
      .select("subscription")
      .eq("businessId", businessId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching current business", fetchError);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }

    // Valid template values
    const validTemplates = [
      "bar-modern",
      "bar-classic",
      "bar-mid",
      "pizza-modern",
      "pizza-classic",
      "pizza-mid",
      "sushi",
      "generic",
      "gold",
      "bar",
      "pizza", // backward compatibility
    ];

    // Build update object - only include fields that are provided
    // Separate name_en from other fields since it should always be saved
    const updateData: any = {};
    const nameEnUpdate: any = {};

    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) {
      // Handle nameEn like menu items - allow null/empty to clear, otherwise trim
      if (nameEn === null || nameEn === "") {
        nameEnUpdate.name_en = null;
      } else if (typeof nameEn === "string") {
        nameEnUpdate.name_en = nameEn.trim() || null;
      } else {
        nameEnUpdate.name_en = nameEn;
      }
    }
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null; // Allow empty string to clear logo
    if (type !== undefined) updateData.type = type;
    if (template !== undefined) {
      // Validate template value
      if (!validTemplates.includes(template)) {
        console.error("❌ Invalid template value:", template);
        return NextResponse.json(
          {
            message: "Invalid template value",
            validTemplates,
            provided: template,
          },
          { status: 400 }
        );
      }
      updateData.template = template;
      console.log("🎨 Template update requested:", template);
    }
    if (aiInstructions !== undefined)
      updateData.aiInstructions = aiInstructions;

    // Handle menuStyle, businessHours, and customContent separately - if columns don't exist, skip them
    // Use actual DB column name: menustyle (lowercase)
    let optionalFieldsUpdate: any = {};
    if (menuStyle !== undefined) {
      optionalFieldsUpdate.menustyle = menuStyle || null; // Use lowercase column name
    }
    if (businessHours !== undefined) {
      optionalFieldsUpdate.businessHours = businessHours || null;
    }

    // Handle customContent separately (like subscription) to ensure it's saved correctly
    let customContentToUpdate: any = null;
    if (customContent !== undefined) {
      console.log(
        "📝 customContent update requested:",
        JSON.stringify(customContent, null, 2)
      );
      // Clean customContent before saving - remove old fields
      if (customContent) {
        customContentToUpdate = {
          ...customContent,
          contact: customContent.contact
            ? {
                enabled: customContent.contact.enabled,
                phone: customContent.contact.phone || "",
                email: customContent.contact.email || "",
                whatsapp: customContent.contact.whatsapp || "",
                instagram: customContent.contact.instagram || "",
                facebook: customContent.contact.facebook || "",
              }
            : undefined,
          loyaltyClub: customContent.loyaltyClub
            ? {
                enabled: customContent.loyaltyClub.enabled,
              }
            : undefined,
        };
      } else {
        customContentToUpdate = null;
      }
      console.log(
        "📝 customContent cleaned for save:",
        JSON.stringify(customContentToUpdate, null, 2)
      );
    }

    // Handle menuOnlyMessage - update subscription JSONB
    // Accept both undefined (not provided) and null (explicitly cleared)
    if (menuOnlyMessage !== undefined) {
      if (!currentBusiness?.subscription) {
        console.warn("No subscription found for business, creating default");
        optionalFieldsUpdate.subscription = {
          status: "trial",
          planType: "menu_only",
          menuOnlyMessage: menuOnlyMessage?.trim() || null,
        };
      } else {
        const currentSubscription = currentBusiness.subscription as any;
        // Ensure we preserve all existing subscription fields
        optionalFieldsUpdate.subscription = {
          ...currentSubscription,
          menuOnlyMessage: menuOnlyMessage?.trim() || null,
        };
        console.log("📝 Current subscription:", currentSubscription);
        console.log(
          "📝 Updated subscription:",
          optionalFieldsUpdate.subscription
        );
      }
      console.log("📝 Updating menuOnlyMessage:", {
        menuOnlyMessage,
        trimmed: menuOnlyMessage?.trim(),
        final: menuOnlyMessage?.trim() || null,
        subscription: optionalFieldsUpdate.subscription,
      });
    } else {
      console.log("📝 menuOnlyMessage not provided (undefined)");
    }

    // At least one field must be provided (including customContent which is updated separately)
    if (
      Object.keys(updateData).length === 0 &&
      Object.keys(optionalFieldsUpdate).length === 0 &&
      customContentToUpdate === null
    ) {
      return NextResponse.json(
        { message: "At least one field must be provided" },
        { status: 400 }
      );
    }

    // Update subscription separately if needed (like in stripe webhook)
    if (optionalFieldsUpdate.subscription) {
      console.log(
        "📝 Updating subscription separately:",
        JSON.stringify(optionalFieldsUpdate.subscription, null, 2)
      );
      const { error: subError, data: subData } = await supabaseAdmin
        .from("businesses")
        .update({ subscription: optionalFieldsUpdate.subscription })
        .eq("businessId", businessId)
        .select("subscription");

      if (subError) {
        console.error("❌ Subscription update error:", subError);
        console.error("❌ Error message:", subError.message);
        console.error("❌ Error code:", subError.code);
        console.error("❌ Error details:", JSON.stringify(subError, null, 2));
        return NextResponse.json(
          {
            message: "Failed to update subscription",
            details: subError.message,
            code: subError.code,
          },
          { status: 500 }
        );
      } else {
        console.log("✅ Subscription update successful");
        console.log(
          "📝 Updated subscription:",
          JSON.stringify(subData?.[0]?.subscription, null, 2)
        );
        console.log(
          "📝 menuOnlyMessage in updated subscription:",
          subData?.[0]?.subscription?.menuOnlyMessage
        );
      }

      // Remove subscription from optionalFieldsUpdate since we already updated it
      delete optionalFieldsUpdate.subscription;
    }

    // Update name_en separately if needed (like customContent)
    if (nameEnUpdate && Object.keys(nameEnUpdate).length > 0) {
      console.log(
        "📝 Updating name_en separately:",
        JSON.stringify(nameEnUpdate, null, 2)
      );
      const { error: nameEnError, data: nameEnData } = await supabaseAdmin
        .from("businesses")
        .update(nameEnUpdate)
        .eq("businessId", businessId)
        .select("name_en");

      if (nameEnError) {
        console.error("❌ name_en update error:", nameEnError);
        // Don't fail the entire request if name_en fails - it might not exist yet
        console.warn(
          "⚠️ name_en update failed, but continuing with other fields"
        );
      } else {
        console.log("✅ name_en update successful");
        console.log(
          "📝 Updated name_en:",
          JSON.stringify(nameEnData?.[0]?.name_en, null, 2)
        );
      }
    }

    // Update all fields together (like menu items do) - include customContent in the main update
    let updatePayload = { ...updateData, ...optionalFieldsUpdate };

    // CRITICAL: Use RPC function for customContent updates (like isEnabled)
    // This bypasses Supabase client parsing issues and ensures data is actually saved
    if (customContentToUpdate !== null) {
      console.log(
        "💾 Saving customContent via RPC function:",
        JSON.stringify(customContentToUpdate, null, 2)
      );

      try {
        const rpcResult = await supabaseAdmin.rpc(
          "update_business_custom_content",
          {
            p_business_id: businessId,
            p_custom_content: customContentToUpdate,
          }
        );

        if (rpcResult.error) {
          console.error("❌ RPC function error:", rpcResult.error);
          return NextResponse.json(
            {
              message: "Failed to update customContent",
              details: rpcResult.error.message,
            },
            { status: 500 }
          );
        }

        if (!rpcResult.data || rpcResult.data.length === 0) {
          console.error("❌ RPC function returned no data");
          return NextResponse.json(
            {
              message: "Failed to update customContent - no data returned",
            },
            { status: 500 }
          );
        }

        console.log("✅ RPC function succeeded!", {
          returnedCustomContent: rpcResult.data[0]?.customContent,
          contact: rpcResult.data[0]?.customContent?.contact,
        });

        // Verify the saved data matches what we sent
        const savedContact = rpcResult.data[0]?.customContent?.contact;
        const expectedContact = customContentToUpdate?.contact;

        if (savedContact && expectedContact) {
          const phoneMatch = savedContact.phone === expectedContact.phone;
          const emailMatch = savedContact.email === expectedContact.email;
          const whatsappMatch =
            savedContact.whatsapp === expectedContact.whatsapp;
          const instagramMatch =
            savedContact.instagram === expectedContact.instagram;
          const facebookMatch =
            savedContact.facebook === expectedContact.facebook;

          console.log("🔍 RPC verification:", {
            phone: {
              expected: expectedContact.phone,
              saved: savedContact.phone,
              match: phoneMatch,
            },
            email: {
              expected: expectedContact.email,
              saved: savedContact.email,
              match: emailMatch,
            },
            whatsapp: {
              expected: expectedContact.whatsapp,
              saved: savedContact.whatsapp,
              match: whatsappMatch,
            },
            instagram: {
              expected: expectedContact.instagram,
              saved: savedContact.instagram,
              match: instagramMatch,
            },
            facebook: {
              expected: expectedContact.facebook,
              saved: savedContact.facebook,
              match: facebookMatch,
            },
          });

          if (
            !phoneMatch ||
            !emailMatch ||
            !whatsappMatch ||
            !instagramMatch ||
            !facebookMatch
          ) {
            console.warn(
              "⚠️ WARNING: RPC saved data does not match expected data!"
            );
          }
        }

        // CRITICAL: Return the RPC result in the response so frontend can use it directly
        // This is the source of truth - don't trust GET requests which return stale data
        return NextResponse.json(
          {
            message: "Business updated successfully",
            business: {
              businessId: rpcResult.data[0]?.businessId,
              customContent: rpcResult.data[0]?.customContent, // Return RPC result - source of truth
            },
          },
          { status: 200 }
        );
      } catch (rpcErr: any) {
        console.error("❌ RPC function exception:", rpcErr);
        return NextResponse.json(
          {
            message: "Failed to update customContent",
            details: rpcErr?.message || "RPC function error",
          },
          { status: 500 }
        );
      }
    }

    // Update other fields (but not customContent - that's handled by RPC above)
    if (Object.keys(updatePayload).length > 0) {
      // Remove customContent from updatePayload since it's handled by RPC
      const { customContent, ...otherFields } = updatePayload;

      if (Object.keys(otherFields).length > 0) {
        // Update other fields normally
        let { error, data } = await supabaseAdmin
          .from("businesses")
          .update(otherFields)
          .eq("businessId", businessId);

        // Log any errors
        if (error) {
          console.error("❌ Error updating business:", error);
          console.error("❌ Error details:", JSON.stringify(error, null, 2));
        } else {
          console.log(
            "✅ Update successful, affected rows:",
            data?.length || "unknown"
          );
        }

        // If error suggests column doesn't exist, try without optional fields
        if (error) {
          // Check if error is due to missing columns (menuStyle, businessHours)
          const isColumnError =
            error.message?.includes("column") ||
            error.message?.includes("does not exist");

          if (isColumnError) {
            // Try updating without optional fields (like menu items do)
            const requiredFieldsOnly: any = {};
            if (updateData.name !== undefined)
              requiredFieldsOnly.name = updateData.name;
            if (updateData.logoUrl !== undefined)
              requiredFieldsOnly.logoUrl = updateData.logoUrl;
            if (updateData.type !== undefined)
              requiredFieldsOnly.type = updateData.type;
            if (updateData.template !== undefined)
              requiredFieldsOnly.template = updateData.template;
            if (updateData.aiInstructions !== undefined)
              requiredFieldsOnly.aiInstructions = updateData.aiInstructions;

            if (Object.keys(requiredFieldsOnly).length > 0) {
              const retry = await supabaseAdmin
                .from("businesses")
                .update(requiredFieldsOnly)
                .eq("businessId", businessId);

              if (retry.error) {
                console.error("Error updating business (retry)", retry.error);
                return NextResponse.json(
                  {
                    message: "Database error",
                    details: retry.error.message,
                  },
                  { status: 500 }
                );
              }
            }
          } else {
            console.error("Error updating business", error);
            return NextResponse.json(
              {
                message: "Database error",
                details: error.message,
              },
              { status: 500 }
            );
          }
        }
      }
    }

    // Verify the update was successful by fetching the updated business
    // Only verify if template was updated
    if (template !== undefined) {
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from("businesses")
        .select("template")
        .eq("businessId", businessId)
        .maybeSingle();

      if (verifyError) {
        console.error("❌ Verification error:", verifyError);
        // Don't fail the request if verification fails - the update might have succeeded
        console.warn(
          "⚠️ Could not verify template update, but update may have succeeded"
        );
      } else {
        console.log("✅ Verification successful");
        console.log("✅ Template in DB:", verifyData?.template);
        console.log("✅ Template requested:", template);

        // Verify that template was updated if it was in the request
        if (verifyData?.template !== template) {
          console.error("❌ Template mismatch!", {
            requested: template,
            actual: verifyData?.template,
          });
          // Don't fail - just log the warning, the update might still be processing
          console.warn("⚠️ Template value mismatch - may be a timing issue");
        } else {
          console.log("✅ Template matches requested value");
        }
      }
    }

    return NextResponse.json(
      { message: "Business updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error updating business:", error);
    console.error("❌ Error stack:", error?.stack);
    console.error("❌ Error message:", error?.message);
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error?.message || "Unknown error",
        error:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
```

### 2. app/api/business/info/route.ts

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { message: "businessId is required" },
        { status: 400 }
      );
    }

    // Try to select all columns - handle missing columns gracefully
    // Use actual DB column name: menustyle (lowercase)
    // Use loose typing here because Supabase returns dynamic shapes depending on selected columns
    // IMPORTANT: Do NOT select legacy contact columns (phone, whatsapp, instagram, facebook) - customContent.contact is the source of truth
    // Only select business.email (the business email, not contact email)
    let { data: business, error }: { data: any; error: any } =
      await supabaseAdmin
        .from("businesses")
        .select(
          "businessId, name, name_en, logoUrl, type, template, menustyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customContent"
        )
        .eq("businessId", businessId)
        .maybeSingle();

    // Use RPC to get customContent - it returns the actual saved data from database
    // The regular query returns stale data, so we use RPC as source of truth
    if (business) {
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
          "get_custom_content",
          {
            p_business_id: businessId,
          }
        );

        if (!rpcError && rpcData) {
          console.log(
            "🔍 RPC function returned customContent:",
            JSON.stringify(rpcData, null, 2).substring(0, 1000)
          );
          // Use RPC result for customContent - it's the source of truth
          business.customContent = rpcData;
        } else if (rpcError) {
          console.warn("⚠️ RPC function error:", rpcError.message);
          // Fallback to regular query if RPC fails
        }
      } catch (rpcErr: any) {
        console.warn("⚠️ RPC function exception:", rpcErr?.message || rpcErr);
        // Fallback to regular query if RPC fails
      }
    }

    // Log raw data from DB to see what we're getting
    if (business) {
      const rawInstagram =
        business.customContent?.contact?.instagram ||
        business.customcontent?.contact?.instagram;
      const rawPhone =
        business.customContent?.contact?.phone ||
        business.customcontent?.contact?.phone;
      const rawWhatsapp =
        business.customContent?.contact?.whatsapp ||
        business.customcontent?.contact?.whatsapp;
      const rawEmail =
        business.customContent?.contact?.email ||
        business.customcontent?.contact?.email;
      const rawFacebook =
        business.customContent?.contact?.facebook ||
        business.customcontent?.contact?.facebook;
      console.log("📥 API: Raw business data from DB:", {
        hasCustomContent: !!business.customContent,
        hasCustomcontent: !!business.customcontent,
        customContentType: typeof business.customContent,
        contact:
          business.customContent?.contact || business.customcontent?.contact,
        phone: rawPhone,
        phoneLength: rawPhone?.length,
        whatsapp: rawWhatsapp,
        whatsappLength: rawWhatsapp?.length,
        email: rawEmail,
        emailLength: rawEmail?.length,
        instagram: rawInstagram,
        instagramLength: rawInstagram?.length,
        instagramBytes: rawInstagram
          ? new TextEncoder().encode(rawInstagram).length
          : 0,
        facebook: rawFacebook,
        facebookLength: rawFacebook?.length,
        // Log the full JSON to see if it's truncated
        customContentJson: JSON.stringify(
          business.customContent || business.customcontent
        ).substring(0, 2000),
      });
    }

    // If error suggests missing column, try without problematic columns or with lowercase
    if (error && error.message?.includes("column")) {
      console.warn(
        "Column may not exist, retrying with fallback:",
        error.message
      );

      // Try with lowercase customcontent if customContent failed
      if (
        error.message?.includes("customContent") ||
        error.message?.includes("customcontent")
      ) {
        console.warn("Trying lowercase customcontent column");
        const retryLowercase = await supabaseAdmin
          .from("businesses")
          .select(
            "businessId, name, name_en, logoUrl, type, template, menustyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customcontent"
          )
          .eq("businessId", businessId)
          .maybeSingle();

        if (!retryLowercase.error && retryLowercase.data) {
          // Map customcontent to customContent
          business = {
            ...retryLowercase.data,
            customContent: retryLowercase.data.customcontent || null,
          };
          delete business.customcontent; // Remove lowercase version
          error = null;
        } else {
          // Try without optional columns (menuStyle, businessHours, customContent)
          const retry = await supabaseAdmin
            .from("businesses")
            .select(
              "businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions"
            )
            .eq("businessId", businessId)
            .maybeSingle();

          // Ensure the fallback result still has optional keys
          business = retry.data
            ? {
                ...retry.data,
                menustyle: null,
                businessHours: null,
                customContent: null,
              }
            : null;
          error = retry.error;
        }
      } else if (
        error.message?.includes("menustyle") ||
        error.message?.includes("menuStyle") ||
        error.message?.includes("businessHours")
      ) {
        // Try without menustyle and businessHours, but keep customContent
        const retry = await supabaseAdmin
          .from("businesses")
          .select(
            "businessId, name, name_en, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, customContent"
          )
          .eq("businessId", businessId)
          .maybeSingle();

        // If that fails, try with lowercase customcontent
        if (retry.error && retry.error.message?.includes("customContent")) {
          const retryLowercase = await supabaseAdmin
            .from("businesses")
            .select(
              "businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, customcontent"
            )
            .eq("businessId", businessId)
            .maybeSingle();

          if (!retryLowercase.error && retryLowercase.data) {
            business = {
              ...retryLowercase.data,
              menustyle: null,
              businessHours: null,
              customContent: retryLowercase.data.customcontent || null,
            };
            delete business.customcontent;
            error = null;
          } else {
            // Final fallback - without all optional columns
            const finalRetry = await supabaseAdmin
              .from("businesses")
              .select(
                "businessId, name, name_en, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions"
              )
              .eq("businessId", businessId)
              .maybeSingle();

            business = finalRetry.data
              ? {
                  ...finalRetry.data,
                  menustyle: null,
                  businessHours: null,
                  customContent: null,
                }
              : null;
            error = finalRetry.error;
          }
        } else {
          // Ensure the fallback result still has optional keys
          business = retry.data
            ? {
                ...retry.data,
                menustyle: null,
                businessHours: null,
                customContent: retry.data.customContent || null,
              }
            : null;
          error = retry.error;
        }
      }

      // If still error and it's about type, try without type
      if (error && error.message?.includes("type")) {
        const retry2 = await supabaseAdmin
          .from("businesses")
          .select(
            "businessId, name, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions"
          )
          .eq("businessId", businessId)
          .maybeSingle();

        business = retry2.data
          ? {
              ...retry2.data,
              // Preserve possible values from previous fallback if they exist
              menustyle:
                (business as any)?.menustyle ??
                (business as any)?.menuStyle ??
                null,
              businessHours: (business as any)?.businessHours ?? null,
              customContent: (business as any)?.customContent ?? null,
            }
          : null;
        error = retry2.error;
      }
    }

    if (error) {
      console.error("Error fetching business info:", error);
      return NextResponse.json(
        { message: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 404 }
      );
    }

    // Ensure all expected fields exist with defaults
    // Map database column name (menustyle) to API response name (menuStyle)
    const menuStyle = business.menustyle || null;

    const businessData = {
      businessId: business.businessId,
      name: business.name,
      nameEn: business.name_en || undefined,
      type: business.type || business.template || "generic",
      template: business.template || "generic",
      menuStyle: menuStyle,
      email: business.email,
      isEnabled: business.isEnabled ?? true,
      subscription: business.subscription || { status: "trial" },
      printerConfig: business.printerConfig || {
        enabled: false,
        type: "http",
        endpoint: "",
        payloadType: "json",
      },
      posConfig: business.posConfig || {
        enabled: false,
        provider: "generic",
        endpoint: "",
        method: "POST",
        headers: {},
        timeoutMs: 5000,
      },
      aiInstructions: business.aiInstructions || null,
      businessHours: business.businessHours || null,
      customContent: (() => {
        // Use the RPC result if available (it's already set in business.customContent above)
        const content =
          business.customContent || business.customcontent || null;
        if (!content) return null;

        // CRITICAL: customContent.contact is the SINGLE SOURCE OF TRUTH
        // Do NOT merge with legacy business columns (phone, email, whatsapp, instagram, facebook)
        // Use customContent.contact exactly as-is if it exists
        // Legacy columns are fallback ONLY if customContent.contact is completely missing

        const cleaned = {
          ...content,
          contact: content.contact
            ? {
                // Use customContent.contact EXACTLY as-is - NO merging, NO overriding
                enabled: content.contact.enabled ?? false,
                phone: content.contact.phone ?? "",
                email: content.contact.email ?? "",
                whatsapp: content.contact.whatsapp ?? "",
                instagram: content.contact.instagram ?? "",
                facebook: content.contact.facebook ?? "",
              }
            : // Fallback ONLY if customContent.contact doesn't exist
              // Note: Legacy columns (phone, whatsapp, instagram, facebook) are NOT selected in the query above
              // So this fallback will only work if they exist in the database and Supabase returns them anyway
              // But customContent.contact should always exist, so this fallback should rarely be used
              undefined,
          loyaltyClub: content.loyaltyClub
            ? {
                enabled: content.loyaltyClub.enabled ?? false,
              }
            : undefined,
        };

        console.log(
          "📥 API: Cleaned customContent (customContent.contact is source of truth):",
          {
            contact: cleaned.contact,
            phone: cleaned.contact?.phone,
            whatsapp: cleaned.contact?.whatsapp,
            email: cleaned.contact?.email,
            instagram: cleaned.contact?.instagram,
            facebook: cleaned.contact?.facebook,
            usingFallback: !content.contact && !!cleaned.contact,
          }
        );

        return cleaned;
      })(),
    };

    return NextResponse.json({ business: businessData }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching business info:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
```

### 3. create_update_custom_content_rpc.sql

```sql
-- Create RPC function to update customContent directly in database
-- This bypasses Supabase client parsing issues and ensures data is actually saved
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_business_custom_content(
  p_business_id TEXT,
  p_custom_content JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "customContent" JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_custom_content JSONB;
  update_count INTEGER;
BEGIN
  -- Log what we're trying to save (for debugging)
  RAISE NOTICE 'Updating customContent for business: %', p_business_id;
  RAISE NOTICE 'New customContent: %', p_custom_content::text;

  -- Get the current value before update (for debugging)
  SELECT b."customContent" INTO v_custom_content
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;

  RAISE NOTICE 'Current customContent before update: %', v_custom_content::text;

  -- Update the customContent directly
  UPDATE public.businesses b
  SET "customContent" = p_custom_content
  WHERE b."businessId" = p_business_id;

  -- Get the number of rows updated
  GET DIAGNOSTICS update_count = ROW_COUNT;

  RAISE NOTICE 'Rows updated: %', update_count;

  -- Verify the update actually happened
  IF update_count = 0 THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;

  -- Force commit by doing a dummy operation that requires commit
  -- This ensures the transaction is committed before we read back
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id));

  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.1);

  -- Fetch the updated values into variables
  -- Use FOR UPDATE to lock the row and prevent concurrent modifications
  SELECT
    b.id,
    b."businessId",
    b.name,
    b."customContent"
  INTO
    v_id,
    v_business_id,
    v_name,
    v_custom_content
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE;

  RAISE NOTICE 'Fetched customContent after update: %', v_custom_content::text;

  -- Verify the value was actually updated by comparing JSONB
  IF v_custom_content IS DISTINCT FROM p_custom_content THEN
    RAISE NOTICE 'WARNING: customContent mismatch! Expected: %, Got: %', p_custom_content::text, v_custom_content::text;

    -- Try one more time with explicit cast
    UPDATE public.businesses b
    SET "customContent" = p_custom_content::jsonb
    WHERE b."businessId" = p_business_id;

    -- Fetch again
    SELECT b."customContent"
    INTO v_custom_content
    FROM public.businesses b
    WHERE b."businessId" = p_business_id;

    RAISE NOTICE 'After retry, fetched customContent: %', v_custom_content::text;

    -- If still doesn't match, raise exception
    IF v_custom_content IS DISTINCT FROM p_custom_content THEN
      RAISE EXCEPTION 'Update failed: customContent was not saved correctly. Expected: %, Got: %', p_custom_content::text, v_custom_content::text;
    END IF;
  END IF;

  -- Return the updated values
  RETURN QUERY SELECT v_id, v_business_id, v_name, v_custom_content;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_custom_content(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_custom_content(TEXT, JSONB) TO authenticated;
```

### 4. create_get_custom_content_rpc.sql

```sql
-- Create RPC function to get customContent directly from database
-- This bypasses Supabase client parsing issues
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_custom_content(p_business_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_custom_content JSONB;
BEGIN
  SELECT "customContent" INTO v_custom_content
  FROM businesses
  WHERE "businessId" = p_business_id;

  RETURN v_custom_content;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_custom_content(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_custom_content(TEXT) TO authenticated;
```

### 5. components/CustomContentEditor.tsx (handleSave function)

```typescript
const handleSave = async () => {
  try {
    setSaving(true);

    // Clean up content - remove old fields that shouldn't be there
    const cleanedContent: CustomContent = {
      ...content,
      contact: content.contact
        ? {
            enabled: content.contact.enabled,
            phone: content.contact.phone || "",
            email: content.contact.email || "",
            whatsapp: content.contact.whatsapp || "",
            instagram: content.contact.instagram || "",
            facebook: content.contact.facebook || "",
          }
        : undefined,
      loyaltyClub: content.loyaltyClub
        ? {
            enabled: content.loyaltyClub.enabled,
          }
        : undefined,
    };

    console.log(
      "💾 Saving customContent:",
      JSON.stringify(cleanedContent, null, 2)
    );
    console.log("💾 BusinessId:", businessId);

    const requestBody = {
      businessId,
      customContent: cleanedContent,
    };
    console.log("💾 Request body:", JSON.stringify(requestBody, null, 2));

    const res = await fetch("/api/business/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log("📥 API Response status:", res.status);
    console.log("📥 API Response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("❌ API Error:", data);
      throw new Error(data.message || data.details || "נכשל בעדכון התוכן");
    }

    // CRITICAL: Use the RPC result from the response - it's the source of truth
    // Don't use cleanedContent - use what the RPC function actually saved
    const rpcCustomContent = data.business?.customContent;

    if (rpcCustomContent) {
      console.log(
        "✅ Save successful, using RPC result from response (source of truth)"
      );
      // Update state with RPC result - this is what was actually saved
      setContent(rpcCustomContent);

      // Call onSave with the RPC result (source of truth)
      // Don't reload from server - it returns stale data
      await onSave(rpcCustomContent);
    } else {
      console.warn(
        "⚠️ No RPC result in response, using cleanedContent as fallback"
      );
      // Fallback to cleanedContent if RPC result not available
      setContent(cleanedContent);
      await onSave(cleanedContent);
    }

    toast.success("התוכן עודכן בהצלחה!");
  } catch (err: any) {
    console.error("❌ Save error:", err);
    console.error("❌ Error stack:", err.stack);
    toast.error(err.message || "נכשל בעדכון התוכן");
  } finally {
    setSaving(false);
  }
};
```

## Analysis

### The Issue

1. **Save Operation Works:**

   - `update_business_custom_content` RPC function successfully saves the data
   - Verification within the RPC function passes (all fields match)
   - The RPC function returns the correct data immediately after save

2. **Read Operation Returns Stale Data:**
   - `get_custom_content` RPC function returns old data
   - This happens even though `update_business_custom_content` verified the save was successful
   - The data returned is from a previous save operation

### Possible Causes

1. **Transaction Isolation:**

   - The `update_business_custom_content` function uses `pg_advisory_xact_lock` and `pg_sleep(0.1)` to force commit
   - But if the read happens in a different transaction/connection, it might still see stale data
   - PostgreSQL read isolation levels might be causing this

2. **Database Triggers:**

   - There might be a trigger on the `businesses` table that modifies `customContent` after update
   - This would explain why the RPC function sees correct data but subsequent reads see old data

3. **Caching:**

   - Supabase might be caching the `customContent` JSONB column
   - Or PostgreSQL itself might have some caching mechanism

4. **Connection Pooling:**

   - Different connections might see different transaction states
   - The update might be committed in one connection, but read happens from a different connection that hasn't seen the commit yet

5. **The RPC Function Itself:**
   - The `get_custom_content` function might be reading from a different source or using a different isolation level

## Recommended Next Steps

1. **Check for Database Triggers:**

   - Run the `check_triggers_on_custom_content.sql` script to see if there are any triggers modifying `customContent`

2. **Add More Logging:**

   - Add logging inside `get_custom_content` RPC function to see what it's actually reading
   - Add logging to check transaction IDs or connection IDs

3. **Test Direct SQL:**

   - Try updating `customContent` directly via SQL and then reading it back immediately
   - See if the issue persists outside of the RPC functions

4. **Check Supabase Settings:**

   - Verify if there are any replication delays or caching settings
   - Check if there are multiple database instances (read replicas)

5. **Modify RPC Functions:**
   - Add explicit transaction control to ensure reads happen after commits
   - Use `SET TRANSACTION ISOLATION LEVEL READ COMMITTED` or similar

## Error Summary

- **Error Type:** Data Persistence / Stale Data
- **Severity:** High - Core functionality broken
- **Affected:** `customContent.contact` fields (phone, email, whatsapp, instagram, facebook)
- **Status:** Save works, but read returns old data
- **Root Cause:** Unknown - likely transaction isolation or database trigger issue

