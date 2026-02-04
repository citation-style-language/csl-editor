"use strict";

// Shared dropdown menu module for both Visual Editor and Code Editor.
// Handles menu population, hover, click, keyboard navigation, and ARIA.

define(['src/options'], function (CSLEDIT_options) {

	var activeMenu = null;

	function openSubmenu($li) {
		$li.addClass('hover');
		$li.find('> ul').css('visibility', 'visible');
		$li.find('> a').attr('aria-expanded', 'true');
		activeMenu = $li;
	}

	function closeSubmenu($li) {
		$li.removeClass('hover');
		$li.data('clickOpen', false);
		$li.find('> ul').css('visibility', 'hidden');
		$li.find('> a').attr('aria-expanded', 'false');
		if (activeMenu && activeMenu[0] === $li[0]) {
			activeMenu = null;
		}
	}

	function closeAllMenus($container) {
		$container.find('ul.dropdown > li').each(function () {
			closeSubmenu($(this));
		});
	}

	function applyAria($container) {
		$container.find('ul.dropdown').attr('role', 'menubar');

		$container.find('ul.dropdown > li').each(function () {
			var $li = $(this);
			var $trigger = $li.find('> a');
			var $submenu = $li.find('> ul');

			$li.attr('role', 'none');

			$trigger.attr({
				'role': 'menuitem',
				'aria-haspopup': 'true',
				'aria-expanded': 'false',
				'tabindex': '-1'
			});

			$submenu.attr('role', 'menu');

			$submenu.find('> li').attr('role', 'none');
			$submenu.find('> li > a').attr({
				'role': 'menuitem',
				'tabindex': '-1'
			});
		});

		// First top-level trigger gets tabindex 0 (roving tabindex start)
		$container.find('ul.dropdown > li:first > a').attr('tabindex', '0');
	}

	function attachHover($container) {
		var hoverTimeout;

		$container.find('ul.dropdown > li').on('mouseenter', function () {
			var $li = $(this);
			clearTimeout(hoverTimeout);
			$container.find('ul.dropdown > li').not($li).each(function () {
				closeSubmenu($(this));
			});
			openSubmenu($li);
		}).on('mouseleave', function () {
			var $li = $(this);
			hoverTimeout = setTimeout(function () {
				closeSubmenu($li);
			}, 300);
		});

		$container.find('ul.dropdown ul').on('mouseenter', function () {
			clearTimeout(hoverTimeout);
		});
	}

	function attachClick($container) {
		var justToggled = false;

		$container.find('ul.dropdown > li > a').on('mousedown', function (e) {
			// Use mousedown to toggle before hover events interfere.
			// mousedown fires before any click/mouseup sequence.
			var $li = $(this).parent('li');
			var wasClickOpen = $li.data('clickOpen');

			closeAllMenus($container);

			if (!wasClickOpen) {
				openSubmenu($li);
				$li.data('clickOpen', true);
			}

			justToggled = true;
			e.preventDefault(); // Prevent text selection
		});

		$container.find('ul.dropdown > li > a').on('click', function (e) {
			// Prevent default link behavior and stop propagation
			// to the document close handler
			e.preventDefault();
			e.stopPropagation();
		});

		$(document).on('mousedown.dropdownMenu', function (e) {
			if (justToggled) {
				justToggled = false;
				return;
			}
			// Don't close if clicking inside a dropdown submenu
			if ($(e.target).closest('ul.dropdown').length) {
				return;
			}
			closeAllMenus($container);
		});
	}

	function attachKeyboard($container) {
		$container.find('ul.dropdown').on('keydown', '[role="menuitem"]', function (e) {
			var $this = $(this);
			var $parentLi = $this.closest('li');
			var isTopLevel = $parentLi.parent().is('ul.dropdown');
			var $allTopTriggers = $container.find('ul.dropdown > li > a');
			var handled = false;
			var idx, $target, $items;

			switch (e.key) {
				case 'ArrowRight':
					if (isTopLevel) {
						idx = $allTopTriggers.index($this);
						$target = $allTopTriggers.eq((idx + 1) % $allTopTriggers.length);
						closeAllMenus($container);
						$this.attr('tabindex', '-1');
						$target.attr('tabindex', '0').focus();
					}
					handled = true;
					break;

				case 'ArrowLeft':
					if (isTopLevel) {
						idx = $allTopTriggers.index($this);
						$target = $allTopTriggers.eq((idx - 1 + $allTopTriggers.length) % $allTopTriggers.length);
						closeAllMenus($container);
						$this.attr('tabindex', '-1');
						$target.attr('tabindex', '0').focus();
					} else {
						var $parentTrigger = $parentLi.closest('ul.dropdown > li').find('> a');
						closeSubmenu($parentLi.closest('ul.dropdown > li'));
						$parentTrigger.focus();
					}
					handled = true;
					break;

				case 'ArrowDown':
					if (isTopLevel) {
						openSubmenu($parentLi);
						$target = $parentLi.find('> ul > li > a').first();
						if ($target.length) $target.focus();
					} else {
						$items = $parentLi.parent().find('> li > a');
						idx = $items.index($this);
						$items.eq((idx + 1) % $items.length).focus();
					}
					handled = true;
					break;

				case 'ArrowUp':
					if (!isTopLevel) {
						$items = $parentLi.parent().find('> li > a');
						idx = $items.index($this);
						$items.eq((idx - 1 + $items.length) % $items.length).focus();
					}
					handled = true;
					break;

				case 'Enter':
				case ' ':
					if (isTopLevel) {
						var isOpen = $parentLi.find('> ul').css('visibility') === 'visible';
						closeAllMenus($container);
						if (!isOpen) {
							openSubmenu($parentLi);
							$parentLi.find('> ul > li > a').first().focus();
						}
					} else {
						closeAllMenus($container);
						$parentLi.closest('ul.dropdown > li').find('> a').focus();
						// Trigger the click handler on the menu item
						$this.trigger('click');
					}
					handled = true;
					break;

				case 'Escape':
					closeAllMenus($container);
					if (!isTopLevel) {
						$parentLi.closest('ul.dropdown > li').find('> a').focus();
					}
					handled = true;
					break;

				case 'Tab':
					closeAllMenus($container);
					break;
			}

			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
	}

	function populateStyleMenu($container) {
		var styleMenu = CSLEDIT_options.get('styleMenu');
		if (typeof styleMenu === 'undefined') {
			$container.find('.dropdown-container').hide();
			return false;
		}

		var $styleMenuUl = $container.find('#styleMenuUl');
		$.each(styleMenu, function (index, styleOption) {
			var $a = $('<a/>').text(styleOption.label).attr({
				'role': 'menuitem',
				'tabindex': '-1'
			});
			var $li = $('<li/>').attr('role', 'none').append($a);

			if (typeof styleOption.name !== 'undefined') {
				$li.attr('id', styleOption.name);
			}
			$a.on('click', styleOption.func);
			$styleMenuUl.append($li);
		});

		return true;
	}

	function init($container) {
		populateStyleMenu($container);
		applyAria($container);
		attachHover($container);
		attachClick($container);
		attachKeyboard($container);
	}

	return {
		init: init,
		closeAll: closeAllMenus,
		applyAria: applyAria
	};
});
