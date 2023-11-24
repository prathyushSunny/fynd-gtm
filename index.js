const EVENT_KEYS = {
  PLP: "product_list.view",
  PDP: "product.view",
  WISHLIST_LISTING: "customEvent.wishlist.list", //custom_event
  WISHLIST_ADD: "wishlist.add",
  WISHLIST_REMOVE: "wishlist.remove",
  CART_ADD: "cart.newProduct",
  CART_REMOVE: "cart.remove",
  CHECKOUT: "customEvent.order.checkout", //custom_event
};

const GTM_EVENTS = {
  PLP: (eventData) => {
    const appliedFilter = (function () {
      if (Object.keys(eventData?.slug)?.length) {
        return Object.keys(eventData.slug)
          .map(
            (filterName) =>
              `${filterName.toLowerCase()}~${eventData.slug[filterName]}`
          )
          .join(",");
      }
      return "none";
    })();
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
          category: item?.category?.toString(),
          position: index + 1,
          appliedFilter,
        })),
      },
    };
  },
  PDP: (eventData) => ({
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
    },
  }),
  WISHLIST_ADD: (eventData) => ({
    event: "addToWishlist",
    category: eventData?.item?.categories[0]?.id.toString(),
    action: "addToWishlist",
    ecommerce: {
      currencyCode: "INR",
      add: {
        products: [
          {
            name: eventData?.item?.name,
            id: eventData?.item?.uid?.toString(),
            category: eventData?.item?.categories[0]?.id.toString(),
            position: 1,
          },
        ],
      },
    },
  }),
  WISHLIST_REMOVE: (eventData) => ({
    event: "removeFromWishlist",
    category: eventData?.item?.categories[0]?.id.toString(),
    action: "removeFromWishlist",
    ecommerce: {
      currencyCode: "INR",
      add: {
        products: [
          {
            name: eventData?.item?.name,
            id: eventData?.item?.uid?.toString(),
            category: eventData?.item?.categories[0]?.id.toString(),
            position: 1,
          },
        ],
      },
    },
  }),
  CART_ADD: (eventData) => ({
    event: "addToCart",
    category: eventData?.products?.[0]?.category?.uid?.toString(),
    action: "addToCart",
    ecommerce: {
      currencyCode: "INR",
      add: {
        actionField: {
          // revenue: 20997,
          action: "add",
        },
        products: [
          {
            name: eventData?.products?.[0]?.name,
            id: eventData?.products?.[0]?.uid.toString(),
            price: eventData?.products?.[0]?.price?.effective,
            variant: {
              size: eventData?.products?.[0]?.size?.toString(),
            },
            category: eventData?.products?.[0]?.category?.uid?.toString(),
            quantity: eventData?.products?.[0]?.quantity?.current?.toString(),
          },
        ],
      },
    },
  }),
  CART_REMOVE: (eventData) => ({
    event: "removeFromCart",
    action: "removeFromCart",
    ecommerce: {
      remove: {
        product: [
          {
            name: eventData?.products?.[0]?.name,
            id: eventData?.products?.[0]?.uid.toString(),
            price: eventData?.products?.[0]?.price?.effective,
            variant: {
              size: eventData?.products?.[0]?.size?.toString(),
            },
            category: eventData?.products?.[0]?.category?.uid?.toString(),
            quantity: eventData?.products?.[0]?.quantity?.current?.toString(),
          },
        ],
      },
    },
  }),
  CHECKOUT: (eventData) => ({
    event: "checkout",
    action: "Checkout",
    ecommerce: {
      checkout: {
        actionField: {
          step: 2,
          option: "Shipping Address",
          revenue: eventData?.breakup_values?.display?.[0]?.value,
          action: "checkout",
        },
        products: eventData?.items?.map((item) => ({
            name: item?.product?.name,
            id: item?.product?.uid?.toString(),
            price: item?.price?.base?.effective?.toString() ?? item?.price?.base?.converted?.toString(),
            variant: {
              size: item?.article?.size?.toString(),
              color: item?.product?.attributes?.color
            },
            category: "",
            quantity: item?.quantity,
        }))
      },
    },
  }),
  WISHLIST_LISTING: (eventData) => ({
    event: "impressionSent",
    action: "Product Impression",
    label: "Wishlist page",
    ecommerce: {
      currencyCode: "INR",
      impressions: eventData?.items?.map((item, index) => ({
        name: item?.name,
        id: item?.uid?.toString(),
        price: item?.price?.effective?.min?.toString(),
        list: "List",
        position: index + 1
      })),
    },
  }),
};

function triggerEvent(EVENT_KEY) {
  FPI.event.on(EVENT_KEYS[EVENT_KEY], (eventData) => {
    console.log(eventData);
    dataLayer.push(GTM_EVENTS[EVENT_KEY](eventData));
  });
}

Object.keys(EVENT_KEYS).map(triggerEvent);
