import type { LanguageName } from './domain/types.ts'

export type LanguageMeta = {
  name: LanguageName
  english: string
  code: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageMeta[] = [
  { name: 'English', english: 'English', code: 'en', dir: 'ltr' },
  { name: 'አማርኛ', english: 'Amharic', code: 'am', dir: 'ltr' },
  { name: 'Afaan Oromoo', english: 'Oromo', code: 'om', dir: 'ltr' },
  { name: 'ትግርኛ', english: 'Tigrinya', code: 'ti', dir: 'ltr' },
  { name: 'Français', english: 'French', code: 'fr', dir: 'ltr' },
  { name: 'العربية', english: 'Arabic', code: 'ar', dir: 'rtl' },
]

export function getLanguageMeta(lang: LanguageName | string): LanguageMeta {
  return LANGUAGES.find((item) => item.name === lang) ?? LANGUAGES[0]
}

export const en = {
  'app.name': 'Gebeta',
  'app.tagline': 'Good food · moving fast',
  'app.cityEst': 'Addis Ababa · Est. 2024',
  'app.versionWeb': 'Gebeta for Web · 2.0',
  'app.versionAndroid': 'Gebeta for Android · 2.0',

  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.orders': 'Orders',
  'nav.saved': 'Saved',
  'nav.profile': 'Profile',
  'nav.bag': 'Bag',

  'common.back': 'Back',
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.clear': 'Clear',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.apply': 'Apply',
  'common.reset': 'Reset',
  'common.seeAll': 'See all',
  'common.continue': 'Continue',
  'common.skip': 'Skip',
  'common.ok': 'OK',
  'common.free': 'Free',
  'common.freeDelivery': 'Free delivery',
  'common.min': 'min',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'common.default': 'Default',

  'welcome.kicker': 'Delivery, but make it delicious',
  'welcome.titleLine1': 'Food worth',
  'welcome.titleLine2': 'showing up for.',
  'welcome.subtitle':
    'Addis Ababa’s boldest kitchens — from Bole to Piassa — at your door in minutes.',
  'welcome.getStarted': 'Get started',
  'welcome.haveAccount': 'I already have an account',
  'onboarding.createAccount': 'Create my account',

  'auth.signupTitle': 'Create your account',
  'auth.signupSub': 'Join in seconds. Good taste starts here.',
  'auth.signupCta': 'Create account',
  'auth.loginTitle': 'Welcome back',
  'auth.loginSub': 'Sign in to pick up where you left off.',
  'auth.loginCta': 'Sign in',
  'auth.forgotTitle': 'Forgot password?',
  'auth.forgotSub': 'Enter your email and we’ll send a 4-digit code.',
  'auth.forgotCta': 'Send code',
  'auth.forgotLink': 'Forgot password?',
  'auth.otpTitle': 'Check your inbox',
  'auth.otpSub': 'We sent a 4-digit code to {email}.',
  'auth.otpCta': 'Verify',
  'auth.resendIn': 'Resend code in 0:{sec}',
  'auth.resend': 'Resend code',
  'auth.resetTitle': 'Set a new password',
  'auth.resetSub': 'Make it strong — at least 8 characters.',
  'auth.resetCta': 'Update password',
  'auth.fullName': 'Full name',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.newPassword': 'New password',
  'auth.confirmPassword': 'Confirm password',
  'auth.continueGoogle': 'Continue with Google',
  'auth.continueApple': 'Continue with Apple',
  'auth.alreadyMember': 'Already a member?',
  'auth.newToGebeta': 'New to Gebeta?',
  'auth.digitLabel': 'Digit {n}',

  'location.kicker': 'One last thing',
  'location.title': 'What’s good near you?',
  'location.subtitle':
    'Share your location to see kitchens that deliver to you and get accurate arrival times.',
  'location.useCurrent': 'Use current location',
  'location.enterManual': 'Enter address manually',
  'location.error': 'We couldn’t get your location. You can enter an address instead.',
  'location.currentArea': 'Bole · Addis Ababa',
  'location.gpsHint': 'Uses your device location',
  'location.unavailable': 'Location unavailable — search instead',

  'home.deliverTo': 'Deliver to',
  'home.morning': 'Good morning',
  'home.afternoon': 'Good afternoon',
  'home.evening': 'Good evening',
  'home.heroLine1': 'Hungry looks',
  'home.heroLine2': 'good on you.',
  'home.searchPlaceholder': 'Dishes, kitchens, cravings…',
  'home.gurshaTitle': 'The Gursha Edit',
  'home.gurshaDetail': 'Issue 08 · injera, wot & the art of sharing',
  'home.editorsPick': 'Editor’s pick',
  'home.gurshaHeadline': 'One platter, every hand.',
  'home.popularNearby': 'Popular nearby',
  'home.heatTitle': 'The Heat Edit',
  'home.heatDetail': 'Issue 07 · fire-cooked & fearless',
  'home.fromGrill': 'From the grill',
  'home.heatHeadline': 'Turn up the table.',
  'home.fastFresh': 'Fast & fresh',
  'home.fastFreshDetail': 'At your door in under 25 minutes',

  'explore.title': 'Explore',
  'explore.searchPlaceholder': 'Search dishes or kitchens',
  'explore.filters': 'Filters',
  'explore.dishes': 'Dishes',
  'explore.kitchens': 'Kitchens',
  'explore.topPicks': 'Top picks near you',
  'explore.emptyTitle': 'Nothing matches yet',
  'explore.emptyText': 'Try another cuisine, dish, or loosen your filters.',
  'explore.resetFilters': 'Reset filters',
  'explore.searchAction': 'Browse dishes & kitchens',

  'filters.title': 'Filter & sort',
  'filters.sortBy': 'Sort by',
  'filters.price': 'Price',
  'filters.freeDeliveryOnly': 'Free delivery only',
  'filters.showPlaces': 'Show {count} places',
  'filters.sortRecommended': 'Recommended',
  'filters.sortFastest': 'Fastest delivery',
  'filters.sortTopRated': 'Top rated',
  'filters.sortLowestFee': 'Lowest fee',

  'price.budget': 'Budget',
  'price.midrange': 'Mid-range',
  'price.premium': 'Premium',

  'cuisine.all': 'All',
  'cuisine.ethiopian': 'Ethiopian',
  'cuisine.japanese': 'Japanese',
  'cuisine.italian': 'Italian',
  'cuisine.pizza': 'Pizza',
  'cuisine.healthy': 'Healthy',
  'cuisine.grill': 'Grill',
  'cuisine.bakery': 'Bakery',

  'restaurant.clubPerk': 'Club perk · Free delivery on orders over {amount}',
  'restaurant.menu': 'Menu',
  'restaurant.madeToOrder': '{count} dishes · made to order',
  'discovery.deliveryPerk': 'Member perk on Br 1,000+ orders',
  'dish.makeItYours': 'Make it yours',
  'dish.chooseAny': 'Optional · choose any',
  'dish.kitchenNote': 'Note for the kitchen',
  'dish.notePlaceholder': 'Allergies, preferences…',
  'dish.addToBag': 'Add to bag',
  'dish.updateItem': 'Update item',

  'cart.title': 'Bag',
  'cart.yourBag': 'Your bag',
  'cart.viewBag': 'View bag',
  'cart.emptyTitle': 'Your bag is empty',
  'cart.emptyText': 'Something delicious is only a few taps away.',
  'cart.exploreKitchens': 'Explore kitchens',
  'cart.clearTitle': 'Clear your bag?',
  'cart.clearMessage': 'All items will be removed.',
  'cart.clearConfirm': 'Clear bag',
  'cart.pairings': 'Goes well with',
  'cart.deliveryInstructions': 'Delivery instructions',
  'cart.addCourierNote': 'Add a note for your courier',
  'cart.addPromo': 'Add promo code',
  'cart.promoApplied': '{code} applied',
  'cart.tryPromo': 'Try BITE20',
  'cart.youSave': 'You’re saving {amount}',
  'cart.checkout': 'Checkout',

  'costs.subtotal': 'Subtotal',
  'costs.delivery': 'Delivery',
  'costs.priority': 'Priority',
  'costs.serviceFee': 'Service fee',
  'costs.vat': 'VAT (15%)',
  'costs.promo': 'Promo',
  'costs.total': 'Total',

  'steps.address': 'Address',
  'steps.delivery': 'Delivery',
  'steps.payment': 'Payment',
  'steps.review': 'Review',

  'checkout.title': 'Checkout',
  'checkout.whereTo': 'Where to?',
  'checkout.addAddress': 'Add a new address',
  'checkout.deliverHere': 'Deliver here',
  'checkout.when': 'When?',
  'checkout.standard': 'Standard',
  'checkout.standardDesc': '20–30 min',
  'checkout.included': 'Included',
  'checkout.priority': 'Priority',
  'checkout.priorityDesc': '15–20 min · sent first',
  'checkout.schedule': 'Schedule',
  'checkout.scheduleDesc': 'Pick a time later today',
  'checkout.continuePayment': 'Continue to payment',
  'checkout.howToPay': 'How to pay?',
  'checkout.wallet': 'Wallet',
  'checkout.paymentMethods': 'Payment methods',
  'checkout.addCard': 'Add a card',
  'checkout.reviewOrder': 'Review order',
  'checkout.looksGood': 'Looks good?',
  'checkout.arriving': 'Arriving',
  'checkout.placeOrder': 'Place order',
  'checkout.placeOrderCash': 'Place order · cash',
  'checkout.payWith': 'Pay with {method}',
  'checkout.stepOf': 'Step {current} of {total}',
  'checkout.doneEditing': 'Back to review',
  'checkout.prototypeFine': 'Prices in Ethiopian Birr; 15% VAT added at checkout.',

  'confirm.title': 'We’ve got it.',
  'confirm.subtitle':
    '{restaurant} is firing up your order. We’ll keep you posted every step of the way.',
  'confirm.trackOrder': 'Track my order',
  'confirm.backHome': 'Back to home',

  'promo.title': 'Promo code',
  'promo.codeLabel': 'Code',
  'promo.placeholder': 'Enter code',
  'promo.available': 'Available to you',
  'promo.offerTitle': '20% off this order',
  'promo.upTo': 'Up to {amount}',
  'promo.remove': 'Remove {code}',

  'card.title': 'Add a card',
  'card.number': 'Card number',
  'card.expiry': 'Expiry',
  'card.cvc': 'CVC',
  'card.nameOnCard': 'Name on card',
  'card.add': 'Add card',
  'card.expires': 'Expires {exp}',
  'card.note': 'Saved on this device only — no real charges are made.',
  'card.prototypeNote': 'Saved on this device only — no real charges are made.',
  'card.removeTitle': 'Remove this card?',
  'card.removeMessage': '{label} will be removed from your wallet.',

  'payment.telebirrLabel': 'Telebirr',
  'payment.telebirrDetail': '+251 91 ·••• 48',
  'payment.cashBadge': 'Pay in cash on arrival',
  'payment.removeCard': 'Remove',

  'orders.title': 'Orders',
  'orders.inProgress': 'In progress',
  'orders.pastOrders': 'Past orders',
  'orders.idleTitle': 'Nothing cooking right now',
  'orders.idleText': 'Your next favorite is a few taps away.',
  'orders.history': 'Order history',
  'orders.historyTitle': 'History',
  'orders.all': 'All',
  'orders.active': 'Active',
  'orders.delivered': 'Delivered',
  'orders.canceled': 'Canceled',
  'orders.emptyHistory': 'They’ll show up here.',
  'history.emptyFiltered': 'No {filter} orders yet',

  'status.active': 'In progress',
  'status.delivered': 'Delivered',
  'status.canceled': 'Canceled',

  'tracking.title': 'Tracking',
  'tracking.live': 'Live',
  'tracking.arrivingIn': 'Arriving in',
  'tracking.away': 'away',
  'tracking.enjoyMeal': 'Enjoy your meal.',
  'tracking.rateOrder': 'Rate your order',
  'tracking.yourCourier': 'Your courier',
  'tracking.holdToCancel': 'Hold to cancel order',
  'tracking.keepHolding': 'Keep holding…',
  'tracking.somethingWrong': 'Something wrong? Get help',
  'tracking.noActiveTitle': 'No active order',
  'tracking.noActiveText': 'Orders you place will appear here live.',

  'stage.confirmedTitle': 'Order confirmed',
  'stage.confirmedDetail': 'The kitchen has accepted your order',
  'stage.preparingTitle': 'Preparing your food',
  'stage.preparingDetail': 'Chefs are cooking it right now',
  'stage.onWayTitle': 'On the way',
  'stage.onWayDetail': 'Dawit picked up your order',
  'stage.nearTitle': 'Around the corner',
  'stage.nearDetail': 'Less than three minutes away',
  'stage.deliveredTitle': 'Delivered',
  'stage.deliveredDetail': 'Left at your door',

  'completed.title': 'Enjoy every bite.',
  'completed.subtitle': 'Left at your door, still hot. How did we do?',
  'completed.continueReview': 'Continue review',
  'completed.done': 'Done',

  'review.title': 'Review',
  'review.howWasIt': 'How was it?',
  'review.tapToRate': 'Tap to rate',
  'review.anythingElse': 'Anything else?',
  'review.placeholder': 'What stood out?',
  'review.submit': 'Submit review',
  'review.reorder': 'Reorder',
  'review.getHelp': 'Get help with this order',
  'review.starOne': '{count} star',
  'review.starMany': '{count} stars',

  'favorites.title': 'Saved',
  'favorites.kitchens': 'Kitchens',
  'favorites.dishes': 'Dishes',
  'favorites.noKitchensTitle': 'No saved kitchens',
  'favorites.noKitchensText': 'Tap the heart on any kitchen to keep it here.',
  'favorites.noDishesTitle': 'No saved dishes',
  'favorites.noDishesText': 'Save dishes you love to reorder them in seconds.',
  'favorites.exploreDishes': 'Explore dishes',
  'favorites.save': 'Save {name}',
  'favorites.remove': 'Remove {name} from saved',

  'profile.memberSince': 'Member since 2024',
  'profile.editProfile': 'Edit profile',
  'profile.delivered': 'Delivered',
  'profile.saved': 'Saved',
  'profile.yourRating': 'Your rating',
  'profile.clubName': 'Gebeta Club',
  'profile.clubSaved': 'saved',
  'profile.clubSubtitle': 'on delivery, promos & member perks',
  'profile.clubProgress': '{count} of {target} orders to {next}',
  'profile.clubMaxTier': 'Top Platinum tier unlocked',
  'profile.addresses': 'Addresses',
  'profile.wallet': 'Wallet',
  'profile.preferences': 'Preferences',
  'profile.notifications': 'Notifications',
  'profile.language': 'Language',
  'profile.settings': 'Settings',
  'profile.support': 'Support',
  'profile.helpCenter': 'Help center',
  'profile.chatWithUs': 'Chat with us',
  'profile.chatRepliesIn': 'Typically replies in 2 min',
  'profile.reportIssue': 'Report an issue',
  'profile.signOut': 'Sign out',
  'profile.signOutTitle': 'Sign out of Gebeta?',
  'profile.signOutMessage': 'Your bag will be cleared on this device.',

  'addresses.title': 'Addresses',
  'addresses.new': 'New address',
  'addresses.edit': 'Edit address',
  'addresses.find': 'Find address',
  'addresses.searchPlaceholder': 'Street, building, or neighborhood',
  'addresses.useCurrent': 'Use current location',
  'addresses.suggestions': 'Suggestions',
  'addresses.results': 'Results',
  'addresses.dragMap': 'Drag the map to adjust',
  'addresses.deliveryPin': 'Delivery pin',
  'addresses.confirmLocation': 'Confirm location',
  'addresses.details': 'Details',
  'addresses.label': 'Label',
  'addresses.home': 'Home',
  'addresses.work': 'Work',
  'addresses.other': 'Other',
  'addresses.street': 'Street address',
  'addresses.apt': 'Apartment, suite, floor',
  'addresses.instructions': 'Instructions for the courier',
  'addresses.delete': 'Delete address',
  'addresses.save': 'Save address',
  'addresses.setDefault': 'Set as default',
  'addresses.useCustom': 'Use “{query}”',
  'addresses.cityFallback': 'Addis Ababa',

  'notifications.title': 'Notifications',
  'notifications.ordersGroup': 'Orders',
  'notifications.orderUpdates': 'Order updates',
  'notifications.orderUpdatesDetail': 'Confirmations and status changes',
  'notifications.courierMsgs': 'Courier messages',
  'notifications.courierMsgsDetail': 'When your courier reaches out',
  'notifications.discoveryGroup': 'Discovery',
  'notifications.picks': 'Picks for you',
  'notifications.picksDetail': 'New kitchens matched to your taste',
  'notifications.offers': 'Offers & Club drops',
  'notifications.offersDetail': 'Member perks and promo codes',
  'notifications.sendTest': 'Send a test notification',

  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.app': 'App',
  'settings.replayIntro': 'Replay introduction',
  'settings.support': 'Support',
  'language.title': 'Language',
  'language.note': 'Menus from kitchens stay in their original language.',

  'help.title': 'Help',
  'help.support': 'Support',
  'help.heroLine1': 'How can',
  'help.heroLine2': 'we help?',
  'help.searchPlaceholder': 'Search help articles',
  'help.popular': 'Popular questions',
  'help.noResultsTitle': 'No articles found',
  'help.noResultsText': 'Try different words, or chat with us.',
  'help.faqTitle': 'FAQ',
  'help.questionsTitle': 'Questions',
  'help.stillStuck': 'Still stuck?',

  'chat.online': 'Online',
  'chat.supportName': 'Liya · Gebeta Support',
  'chat.courierName': 'Dawit · Courier',
  'chat.simulated': 'Simulated courier & support replies',
  'chat.placeholder': 'Message',
  'chat.send': 'Send',
  'chat.attach': 'Attach photo',
  'chat.greetingGeneral': 'Selam! I’m Liya from Gebeta. What can I help you with?',
  'chat.greetingCourier': 'Selam! Dawit here — I’m on my way with your order.',
  'chat.introReply':
    'Thanks for letting us know — I’m looking into this order now. You’ll have an update in a moment.',

  'report.title': 'Report an issue',
  'report.heading': 'What happened?',
  'report.detailsLabel': 'Details (optional)',
  'report.detailsPlaceholder': 'Add anything that helps us fix it',
  'report.continue': 'Continue to support',
  'report.late': 'Order is late',
  'report.lateDesc': 'Past the arrival window',
  'report.missing': 'Missing items',
  'report.missingDesc': 'Something wasn’t in the bag',
  'report.wrong': 'Wrong items',
  'report.wrongDesc': 'I got someone else’s food',
  'report.quality': 'Quality issue',
  'report.qualityDesc': 'Cold, spilled, or not as described',
  'report.courier': 'Courier issue',
  'report.courierDesc': 'Problem with the handoff',
  'report.other': 'Something else',
  'report.otherDesc': 'Tell us what happened',

  'toast.addedToBag': 'Added to bag',
  'toast.bagUpdated': 'Bag updated',
  'toast.removedFromBag': 'Removed from bag',
  'toast.bagCleared': 'Bag cleared',
  'toast.savedFavorite': 'Saved to favorites',
  'toast.removedFavorite': 'Removed from Saved',
  'toast.orderCanceled': 'Order canceled. You won’t be charged.',
  'toast.addressAdded': 'Address added',
  'toast.addressUpdated': 'Address updated',
  'toast.addressDeleted': 'Address deleted',
  'toast.defaultAddress': '{label} set as default address',
  'toast.defaultPayment': '{label} is now your default',
  'toast.cardAdded': '{brand} added',
  'toast.cardRemoved': 'Payment method removed',
  'toast.promoApplied': '{code} applied — 20% off',
  'toast.promoRemoved': 'Promo removed',
  'toast.instructionsSaved': 'Instructions saved',
  'toast.profileUpdated': 'Profile updated',
  'toast.reviewThanks': 'Thanks — your review helps the kitchen',
  'toast.languageUpdated': 'Language set to {lang}',
  'toast.signedOut': 'Signed out',
  'toast.pressBackExit': 'Press back again to exit',
  'toast.testNoticeSent': 'Test notification sent',
  'toast.enableNotices': 'Enable notifications in device settings',
  'toast.noticesUnsupported': 'Notifications aren’t supported here',
  'toast.welcomeBack': 'Welcome back, {name}',
  'toast.reordered': '{count} items added to bag',

  'dialog.newBagTitle': 'Start a new bag?',
  'dialog.newBagMessage': 'Your bag has items from {current}. Replace it with {next}?',
  'dialog.newBagConfirm': 'Start new bag',

  'validation.cardNumber': 'Enter a valid card number.',
  'validation.cardExp': 'Use MM/YY in the future.',
  'validation.cardCvc': '3–4 digits.',
  'validation.cardName': 'Name on card.',
  'validation.profileName': 'Enter your name.',
  'validation.profileEmail': 'Enter a valid email.',
  'validation.profilePhone': 'Enter a valid phone number.',
  'validation.promoEmpty': 'Add something to your bag first.',
  'validation.promoInvalid': 'That code isn’t valid. Try BITE20.',

  'onboarding.s1Kicker': 'Find your flavor',
  'onboarding.s1Title': 'From doro wot to dumplings.',
  'onboarding.s1Desc':
    'Slow-simmered wot, sizzling tibs, and the city’s best kitchens — all in one place.',
  'onboarding.s1Sticker': '7 kitchens nearby',
  'onboarding.s2Kicker': 'Watch it move',
  'onboarding.s2Title': 'Dinner has a pulse.',
  'onboarding.s2Desc':
    'Follow every step live — from the first sizzle of the shekla to the knock at your door.',
  'onboarding.s2Sticker': 'Live tracking',
  'onboarding.s3Kicker': 'Make it yours',
  'onboarding.s3Title': 'Built around your appetite.',
  'onboarding.s3Desc':
    'Save your go-to gursha, choose your spice level, and reorder in a single tap.',
  'onboarding.s3Sticker': 'Saved for you',

  'auth.errCode': 'Enter all four digits.',
  'auth.errPassword': 'Use at least 8 characters.',
  'auth.errConfirm': 'Passwords don’t match.',
  'auth.errName': 'Enter your full name.',
  'auth.errEmail': 'Enter a valid email address.',
  'auth.pwPlaceholder': 'At least 8 characters',
  'auth.confirmPlaceholder': 'Re-enter password',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.namePlaceholder': 'Natnael Tezazu',
  'auth.orDivider': 'or',
  'auth.otpHint': 'Quick demo verify — enter any 4 digits.',
  'auth.pwUpdated': 'Password updated — sign in again',
  'auth.resendToast': 'A new code is on its way',

  'tracking.canceledTitle': 'Order canceled',
  'tracking.canceledDesc': 'You haven’t been charged.',
  'tracking.courierStats': '4.9 ★ · e-bike · 320 deliveries',
  'tracking.contactCourier': 'Contact Dawit',
  'tracking.callTitle': 'Call Dawit?',
  'tracking.callMessage': 'Voice calls use a private relay on mobile; simulated here.',
  'tracking.callToast': 'Private voice relay simulated in this demo',
  'tracking.sendMessage': 'Send a message',
  'tracking.repliesFast': 'Usually replies right away',
  'tracking.callCourier': 'Call Dawit',
  'tracking.privateNumber': 'Your number stays private',
  'tracking.protoHint': 'Live delivery simulation — stages advance automatically.',
  'tracking.msgCourierLabel': 'Message courier',
  'tracking.callCourierLabel': 'Contact courier',
  'tracking.expandDetails': 'Show details',
  'tracking.collapseDetails': 'Hide details',

  'order.title': 'Order {id}',
  'order.item': '{count} item',
  'order.items': '{count} items',
  'order.totalPaid': 'Total paid',

  'review.word1': 'Not great',
  'review.word2': 'Could be better',
  'review.word3': 'Pretty good',
  'review.word4': 'Really good',
  'review.word5': 'Outstanding',
  'review.tag1': 'Delicious',
  'review.tag2': 'Hot & fresh',
  'review.tag3': 'Great portions',
  'review.tag4': 'Fast delivery',
  'review.tag5': 'Nice packaging',
  'review.tag6': 'Friendly courier',

  'explore.match': '{count} match',
  'explore.matches': '{count} matches',
  'explore.place': '{count} place',
  'explore.places': '{count} places',
  'filters.showPlace': 'Show {count} place',
  'menu.addItem': 'Add {name}',
  'menu.cal': '{cal} cal',

  'profile.ordersTotal': '{count} total',
  'profile.savedOne': '{count} item',
  'profile.savedCount': '{count} items',
  'profile.addressOne': '{count} saved',
  'profile.addressesCount': '{count} saved',
  'profile.walletOne': '{count} method',
  'profile.walletCount': '{count} methods',
  'profile.noticesOn': '{count} on',

  'addresses.chooseSpot': 'Choose a spot',
  'addresses.noLocation': 'No location set',
  'addresses.deleteConfirmTitle': 'Delete this address?',
  'addresses.deleteConfirmMsg': '{label} · {line1} will be removed.',
  'addresses.streetErr': 'Enter a street address.',
  'addresses.aptPlaceholder': 'Apt 4B',
  'addresses.notesPlaceholder': 'Gate code, landmarks, where to leave it…',
  'addresses.change': 'Change',

  'instructions.p1': 'Leave at the door',
  'instructions.p2': 'Hand it to me',
  'instructions.p3': 'Ring the bell',
  'instructions.p4': 'Meet in lobby',

  'notifications.testBody': 'Your order is on its way.',

  'chat.quick1': 'Leave it at the door',
  'chat.quick2': 'I’m coming down',
  'chat.quick3': 'Call when you arrive',
  'chat.reply1': 'Got the photo, thank you. That really helps.',
  'chat.reply2': 'No problem, I’ll leave it at the door.',
  'chat.reply3': 'Sounds good, see you in a few minutes!',
  'chat.reply4':
    'I can help with that. Refunds return to your original payment method within 3–5 business days.',
  'chat.reply5': 'Your courier is close — the map in Orders updates live.',
  'chat.reply6': 'Got it. Is there anything else I can do for you?',
  'chat.deliveredBody': 'Your {restaurant} order has been delivered.',

  'editProfile.title': 'Edit profile',
  'editProfile.changePhoto': 'Change photo',
  'editProfile.removePhoto': 'Remove photo',
  'editProfile.phone': 'Phone',
  'editProfile.saveChanges': 'Save changes',

  'help.resultsCount': '{count} results',
  'faq.q1': 'Where is my order?',
  'faq.a1':
    'Open Orders and tap your active order. You’ll see live status, your courier, and an updated arrival window.',
  'faq.q2': 'How do refunds work?',
  'faq.a2':
    'If something is missing or wrong, report it from the order. Approved refunds return to your original payment method within 3–5 business days.',
  'faq.q3': 'Can I change my delivery address?',
  'faq.a3':
    'Before the kitchen accepts your order, yes. After that, message your courier or chat with support and we’ll do our best.',
  'faq.q4': 'How do I use a promo code?',
  'faq.a4':
    'In your bag, tap “Add promo code”, enter the code, and the discount applies to your subtotal instantly.',
  'faq.q5': 'What is Gebeta Club?',
  'faq.a5':
    'Gebeta Club members get free delivery on orders over Br 1,000, member-only drops, and savings tracked right on your profile.',

  'club.silver': 'Silver',
  'club.gold': 'Gold',
  'club.platinum': 'Platinum',
  'tracking.scheduledFor': 'Scheduled · {time}',
  'addresses.nudgeLabel': 'Move delivery pin',

  'ui.showPassword': 'Show password',
  'ui.hidePassword': 'Hide password',
  'ui.mainNav': 'Main navigation',
} as const

export type TranslationKey = keyof typeof en
export type LocaleDictionary = Record<TranslationKey, string>

export const TRANSLATION_KEYS = Object.keys(en) as TranslationKey[]

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string

const loadedLocales = new Map<LanguageName, LocaleDictionary>([['English', en]])
const pendingLocales = new Map<LanguageName, Promise<LocaleDictionary>>()

/**
 * Lazily loads a non-English locale dictionary chunk on demand.
 * English returns immediately from the base module without network/chunk overhead.
 */
export async function loadLocale(lang: LanguageName): Promise<LocaleDictionary> {
  const cached = loadedLocales.get(lang)
  if (cached) return cached

  const inFlight = pendingLocales.get(lang)
  if (inFlight) return inFlight

  const loadPromise = (async (): Promise<LocaleDictionary> => {
    let loaded: LocaleDictionary
    switch (lang) {
      case 'አማርኛ':
        loaded = (await import('./locales/am.ts')).default
        break
      case 'Afaan Oromoo':
        loaded = (await import('./locales/om.ts')).default
        break
      case 'ትግርኛ':
        loaded = (await import('./locales/ti.ts')).default
        break
      case 'Français':
        loaded = (await import('./locales/fr.ts')).default
        break
      case 'العربية':
        loaded = (await import('./locales/ar.ts')).default
        break
      case 'English':
      default:
        loaded = en
        break
    }
    loadedLocales.set(lang, loaded)
    pendingLocales.delete(lang)
    return loaded
  })()

  pendingLocales.set(lang, loadPromise)
  return loadPromise
}

/** Creates a translation helper bound to a dictionary or loaded language with `{var}` interpolation. */
export function createT(
  langOrDict: LanguageName | LocaleDictionary | string,
  overrideDict?: LocaleDictionary,
): TranslateFn {
  const dict: LocaleDictionary =
    typeof langOrDict === 'string'
      ? (overrideDict ?? loadedLocales.get(getLanguageMeta(langOrDict).name) ?? en)
      : langOrDict

  return (key: TranslationKey, vars?: Record<string, string | number>): string => {
    let text = dict[key] ?? en[key] ?? key
    if (vars) {
      for (const [varKey, varValue] of Object.entries(vars)) {
        text = text.split(`{${varKey}}`).join(String(varValue))
      }
    }
    return text
  }
}

/** Formats singular vs plural localized labels cleanly across languages. */
export function plural(
  t: TranslateFn,
  count: number,
  singularKey: TranslationKey,
  pluralKey: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  return t(count === 1 ? singularKey : pluralKey, { count, ...vars })
}

/** Returns all 5 FAQ question/answer pairs localized via `t`. */
export function getLocalizedFaqs(t: TranslateFn): [string, string][] {
  return [
    [t('faq.q1'), t('faq.a1')],
    [t('faq.q2'), t('faq.a2')],
    [t('faq.q3'), t('faq.a3')],
    [t('faq.q4'), t('faq.a4')],
    [t('faq.q5'), t('faq.a5')],
  ]
}
