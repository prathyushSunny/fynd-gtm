/* --------
Documentation: https://gofynd.quip.com/Lu4pAbvzN0Uu/GTM-Extension
Events Reference: https://partners.fynd.com/help/docs/partners/themes/events
CUSTOM EVENTS - Need to be fired from the Theme repo (How to? - Check the documentation above)
-------- */

const GTM_EVENT_KEYS = {
  ADD_ADDRESS_INFORMATION: "order.address_information",
  ADD_PAYMENT_INFORMATION: "order.payment_information",
  CART_ADD: "cart.newProduct",
  CART_REMOVE: "cart.remove",
  CART_UPDATE: "cart.update",
  CART_VIEW: "cart.view",
  CHECKOUT: "order.checkout",
  COLLECTION_LISTING: "collection_list.view",
  LOGIN: "user.login",
  ORDER_PROCESSED: "order.processed",
  PINCODE_SERVICEABILITY: "pincode.serviceablility",
  PLP_PRODUCT_CLICK: "custom.productClick", // CUSTOM_EVENT
  PRODUCT_COMPARE_ADD: "compare.add",
  PRODUCT_COMPARE_REMOVE: "compare.remove",
  PRODUCT_DESCRIPTION: "product.view",
  PRODUCT_LISTING: "product_list.view",
  SEARCH_PRODUCT: "search.product",
  WISHLIST_ADD: "wishlist.add",
  WISHLIST_REMOVE: "wishlist.remove",
};

const GTM_UTILS = {
  getExistingCartItemsGtm: () => {
    const existingCartItems = GTM_UTILS.getExistingCartItems();
    if (!Object.keys(existingCartItems).length === 0) return {};
    return existingCartItems.value.items.map((cartItem) => {
      return {
        name: cartItem?.product?.name,
        productId: cartItem?.product?.uid?.toString(),
        itemPrice: cartItem?.price_per_unit?.base?.effective,
        mrp: cartItem?.price_per_unit?.base?.effective,
        variant: cartItem?.article?.size?.toString(),
        quantity: cartItem?.quantity,
      };
    });
  },
  getAllCookies: () => {
    const cookies = {};
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
      const cookie = cookieArray[i].trim();
      const separatorIndex = cookie.indexOf('=');
      const cookieName = cookie.substring(0, separatorIndex);
      const cookieValue = cookie.substring(separatorIndex + 1);
      cookies[cookieName] = cookieValue;
    }
    return cookies;
  },
  getExistingCartItems: () => JSON.parse(localStorage.getItem("m_usercart")) || {},
  getViewCartData: () => {
    const existingCartItems = GTM_UTILS.getExistingCartItems();
    const getProductDiscount = (item) => {
      const discount = item?.discount;
      if (!discount) return 0;
      return parseInt(discount.split("%")[0]);
    };
    if (!Object.keys(existingCartItems).length === 0) return {};
    return existingCartItems.value.items.map((cartItem) => {
      return {
        name: cartItem?.product?.name,
        pid: cartItem?.product?.uid?.toString(),
        id: cartItem?.product?.uid,
        price: cartItem?.price?.converted?.effective,
        mrp: cartItem?.price?.converted?.marked,
        variant: cartItem?.article?.size?.toString(),
        quantity: cartItem?.quantity,
        discount_percentage: getProductDiscount(cartItem),
        brand: cartItem?.product?.brand?.name,
        category: cartItem?.product?.categories?.[0]?.name,
        category_id: cartItem?.product?.categories?.[0]?.uid?.toString(),
      };
    });
  },
  customDelay: (sec) => {
    return new Promise((res) => setTimeout(res, sec * 1000));
  },
  getPricePerUnit: (eventData) => {
    const quantity = eventData?.products?.[0]?.quantity?.current;
    const effectivePrice = eventData?.products?.[0]?.price?.effective;
    return quantity > 1
      ? Math.round(effectivePrice / quantity)
      : effectivePrice;
  },
  cartItems: {}
};

const GTM_FUNCTIONS = {
  ADD_ADDRESS_INFORMATION: (eventData) => {
    return {
      eventData,
    };
  },
  ADD_PAYMENT_INFORMATION: (eventData) => {
    return {
      event: "AddPaymentInfo",
      code: eventData?.payment?.payment_type,
      event_id: eventData?.cart?.cart_id,
    };
  },
  CART_ADD: (eventData, isFromCartUpdate = false) => {
    const cartProductsGtm = GTM_UTILS.getExistingCartItemsGtm();
    return {
      event: "addToCart",
      category: eventData?.products?.[0]?.category?.name,
      action: "addToCart",
      ecommerce: {
        currencyCode: eventData?.products?.[0]?.price?.currency_code,
        add: {
          actionField: {
            revenue: isFromCartUpdate
              ? eventData?.products?.[0]?.price_per_unit?.base?.effective
              : GTM_UTILS.getPricePerUnit(eventData),
            action: "add",
          },
          products: [
            {
              name: eventData?.products?.[0]?.name,
              id: eventData?.products?.[0]?.uid.toString(),
              price:
                eventData?.products?.[0]?.price_per_unit?.base?.effective ??
                GTM_UTILS.getPricePerUnit(eventData),
              variant: eventData?.products?.[0]?.size?.toString(),
              category: eventData?.products?.[0]?.category?.name,
              quantity: 1,
            },
          ],
          cart_products: cartProductsGtm,
        },
      },
    };
  },
  CART_REMOVE: (eventData, isFromCartUpdate = false) => {
    const cartProductsGtm = GTM_UTILS.getExistingCartItemsGtm();
    return {
      event: "removeFromCart",
      action: "removeFromCart",
      ecommerce: {
        remove: {
          actionField: {
            revenue: isFromCartUpdate
              ? eventData?.products?.[0]?.price_per_unit?.base?.effective
              : eventData?.products?.[0]?.price?.effective,
            action: "remove",
          },
          product: [
            {
              name: eventData?.products?.[0]?.name,
              id: eventData?.products?.[0]?.uid.toString(),
              price: isFromCartUpdate
                ? eventData?.products?.[0]?.price_per_unit?.base?.effective
                : eventData?.products?.[0]?.price?.effective,
              variant: eventData?.products?.[0]?.size?.toString(),
              category: eventData?.products?.[0]?.category?.name,
              quantity: isFromCartUpdate
                ? 1
                : eventData?.products?.[0]?.quantity?.current,
            },
          ],
          cart_products: cartProductsGtm,
        },
      },
    };
  },
  CART_UPDATE: (eventData) => {
    if (eventData?.operation === "increment_quantity") {
      return GTM_FUNCTIONS.CART_ADD(eventData, true);
    }
    if (eventData?.operation === "decrement_quantity") {
      return GTM_FUNCTIONS.CART_REMOVE(eventData, true);
    }
    return {};
  },
  CART_VIEW: (eventData) => {
    const cartProductsGtm = GTM_UTILS.getExistingCartItemsGtm();
    const existingCartData = GTM_UTILS.getExistingCartItems();
    const cartIsEmpty =
      !existingCartData || !existingCartData?.value?.items?.length;
    return {
      event: "Cart",
      action: "Cart",
      ecommerce: {
        currencyCode: existingCartData?.value?.currency?.code ?? "INR",
        add: {
          actionField: {
            revenue: cartIsEmpty
              ? 0
              : existingCartData?.value?.breakup_values?.display?.[2]?.value,
          },
          products: cartIsEmpty ? [] : cartProductsGtm,
        },
      },
    };
  },
  CHECKOUT: (eventData, step) => {
    let actionField;
    switch (step) {
      case 1:
        actionField = {
          step: "1",
          cart_amount: eventData?.breakup_values?.display?.[0]?.value,
          event_id: eventData?.cart_id,
          action: "checkout",
        };
        break;
      case 2:
        actionField = {
          step: "2",
          cart_amount: eventData?.breakup_values?.display?.[0]?.value,
          option: "Login",
          action: "checkout",
        };
        break;
      case 3:
        actionField = {
          step: "3",
          cart_amount: eventData?.breakup_values?.display?.[0]?.value,
          option: "shipping address",
          action: "checkout",
        };
        break;
      case 4:
        actionField = {
          step: "4",
          cart_amount: eventData?.breakup_values?.display?.[0]?.value,
          option: "address selected",
          action: "checkout",
        };
        break;
      case 5:
        actionField = {
          step: "5",
          cart_amount: GTM_UTILS.cartItems?.breakup_values?.display?.[0]?.value,
          option: eventData?.payment?.payment_type,
          action: "checkout",
        };
        break;
    }
    return {
      event: "checkout",
      ecommerce: {
        checkout: {
          actionField,
          products: GTM_UTILS.cartItems?.products?.map((item, index) => ({
            name: `${item?.name}|${item?.uid}`,
            id: item?.uid,
            pid: item?.uid?.toString(),
            price: item?.price?.effective,
            mrp: item?.price?.marked,
            discount_percentage: item?.discount ?? 0,
            variant: item?.size?.toString(),
            category: item?.category?.name,
            category_id: item?.category?.uid,
            quantity: item?.quantity?.current,
            brand: item?.brand?.name,
            position: index + 1,
          })),
        },
      },
    };
  },
  LOGIN: (eventData) => {
    const gtm = {
      userid: eventData?.user_id,
      email: eventData?.email,
      name:
        (eventData?.user?.first_name || "") +
        " " +
        (eventData?.user?.last_name || ""),
      telephone: eventData?.phone_number,
      event: "login",
      type: eventData?.method,
    };
    return gtm;
  },
  ORDER_PROCESSED: (eventData) => {
    return {
      event: "transaction",
      ecommerce: {
        purchase: {
          actionField: {
            id: eventData?.order_id?.toString(),
            order_id: eventData?.order_id?.toString(),
            option: "Order success",
            step: "6",
            affiliation: "Online Store",
            revenue: eventData?.breakup_values_raw?.total,
            // tax: "TBD!",
            shipping: eventData?.breakup_values_raw?.delivery_charges,
            payment_method: eventData?.shipments?.[0]?.payment_mode,
            total_quantity: eventData?.items?.length,
            cart_amount: eventData?.breakup_values_raw?.total,
            // coupon_applied: "TBD!",
            coupon_value: eventData?.breakup_values_raw?.coupon.toString(),
            // coupon: "TBD!",
            action: "purchase",
          },
          products: GTM_UTILS.cartItems?.items?.map((item, index) => ({
            name: `${item?.name}`,
            discount_percentage: item?.discount ?? 0,
            variant: item?.size?.toString(),
            brand: item?.brand?.name,
            position: index + 1,
            productId: item?.id,
            pid: item?.id?.toString(),
            price: item?.price,
            mrp: item?.price,
            category:
              item?.l1_categories?.[0] ??
              item?.l2_categories?.[0] ??
              item?.l3_category_name,
            category_id: item?.category?.uid,
            quantity: item?.quantity,
          })),
        },
      },
    };
  },
  PLP_PRODUCT_CLICK: (eventData) => {
    const allCookies = GTM_UTILS.getAllCookies();
    const userToken = FPI?.state?.user?._data?.user?.user_id ?? allCookies?.['_ALGOLIA'] ?? '';
    return {
      userToken,
      index: eventData?.product?._custom_json?.["algolia_index_name"],
      queryID: eventData?.product?._custom_json?.["algolia_query_id"],
      objectIDs: eventData?.product?._custom_json?.["algolia_object_id"],
      event: "productClick",
      action: "productClick",
      category: eventData?.product?.attributes?.["custom-attribute-3"],
      label: "Product List page",
      ecommerce: {
        click: {
          actionField: {
            action: "click",
            list: "list",
          },
          products: [
            {
              name: eventData?.product?.name,
              id: eventData?.product?.uid?.toString(),
              price: eventData?.product?.price?.effective?.min,
              category: eventData?.product?.categories?.[0]?.name,
              position: eventData?.productPosition || 0, //This productPosition should be explicitly sent via eventData coming from the THEME code
              item_list_name: eventData?.product?.attributes?.["custom-attribute-3"],
            },
          ],
        },
      },
    }
  },
  PRODUCT_DESCRIPTION: (eventData) => {
    return {
      event: "ProductDetail",
      action: "Product Detail",
      category: eventData?.product?.category?.uid?.toString(),
      ecommerce: {
        detail: {
          products: [
            {
              name: eventData?.product?.name,
              id: eventData?.product?.uid?.toString(),
              price: eventData?.product?.price?.min?.toString(),
              category: eventData?.product?.category?.uid?.toString(),
            },
          ],
        },
      }
    }
  },
  PRODUCT_LISTING: (eventData) => {
    return {
      event: "impressionSent",
      action: "Product Impression",
      label: "Product List page",
      ecommerce: {
        currencyCode: "INR",
        impressions: eventData.items.map((item, index) => ({
          name: item?.name,
          id: item?.uid?.toString(),
          price: item?.price?.effective?.min?.toString(),
          category: item?.categories?.[0]?.name?.toString(),
          position: index + 1,
        })),
      },
    };
  },
  WISHLIST_ADD: (eventData) => {
    return {
      event: "addToWishlist",
      category: eventData?.item?.categories?.[0]?.name,
      action: "addToWishlist",
      ecommerce: {
        currencyCode: "INR",
        add: {
          products: [
            {
              name: eventData?.item?.name,
              id: eventData?.item?.uid?.toString(),
              category: eventData?.item?.categories?.[0]?.name,
              position: 1,
              price: eventData?.item?.price?.effective?.max,
            },
          ],
        },
      }
    }
  },
  WISHLIST_REMOVE: (eventData) => {
    return {
      event: "removeFromWishlist",
      category: eventData?.item?.categories?.[0]?.name,
      action: "removeFromWishlist",
      ecommerce: {
        currencyCode: "INR",
        add: {
          products: [
            {
              name: eventData?.item?.name,
              id: eventData?.item?.uid?.toString(),
              category: eventData?.item?.categories?.[0]?.name,
              position: 1,
              price: eventData?.item?.price?.effective?.max,
            },
          ],
        },
      },
    }
  },
};

// ** MAIN EXECUTION **
function initializeEvent(EVENT_KEY) {
  let gtmEventKey = GTM_EVENT_KEYS?.[EVENT_KEY];
  let getGtmData = GTM_FUNCTIONS?.[EVENT_KEY];
  if (!gtmEventKey || !getGtmData) return;
  FPI.event.on(gtmEventKey, async (eventData) => {
    console.log(eventData);
    //Checkout step 1-3
    if (gtmEventKey === "order.checkout" || gtmEventKey === "order.processed") {
      GTM_UTILS.cartItems = eventData;
    }
    if (gtmEventKey === "order.checkout") {
      for (let step = 1; step <= 3; step++) {
        dataLayer.push(getGtmData(eventData, step));
      }
      return;
    }
    //Checkout step 4
    else if (gtmEventKey === "order.address_information") {
      getGtmData = GTM_FUNCTIONS?.CHECKOUT;
      dataLayer.push(getGtmData(eventData, 4));
      return;
    }
    //Checkout step 5
    else if (gtmEventKey === "order.payment_information") {
      getGtmData = GTM_FUNCTIONS?.CHECKOUT;
      dataLayer.push(getGtmData(eventData, 5));
      return;
    } else if (
      gtmEventKey === "cart.update" ||
      gtmEventKey === "cart.remove" ||
      gtmEventKey === "cart.newProduct"
    ) {
      await GTM_UTILS.customDelay(0.3);
    }
    dataLayer.push(getGtmData(eventData));
  });
}

Object.keys(GTM_EVENT_KEYS).map(initializeEvent);
