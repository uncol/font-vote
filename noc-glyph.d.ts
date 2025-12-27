/**
 * NOC Semantic Glyph Type Definitions
 * Provides IntelliSense/autocomplete for NOC.glyph.semantic in VSCode
 * Augments the existing NOC global object defined in ui/web/js/boot.js
 */

interface NOC {
  glyph: {
    semantic: {
      // =================================================================
      // NAVIGATION
      // =================================================================

      /** @glyphName arrow_left */
      readonly back_nav: string;
      /** @glyphName xmark */
      readonly close_nav: string;
      /** @glyphName chevrons_up */
      readonly level_up_nav: string;
      /** @glyphName chevrons_down */
      readonly level_down_nav: string;
      /** @glyphName arrow_up */
      readonly up_nav: string;
      /** @glyphName arrow_down */
      readonly down_nav: string;
      /** @glyphName arrow_left */
      readonly left_nav: string;
      /** @glyphName arrow_right */
      readonly right_nav: string;
      /** @glyphName location_arrow_s */
      readonly location_nav: string;
      /** @glyphName location_pin_s */
      readonly map_marker_nav: string;
      /** @glyphName plus_small_s */
      readonly expand_nav: string;
      /** @glyphName minus_small_s */
      readonly collapse_nav: string;
      /** @glyphName bars_s */
      readonly toggle_panels_nav: string;

      // =================================================================
      // ACTIONS
      // =================================================================

      /** @glyphName floppy_disk_s */
      readonly save_action: string;
      /** @glyphName plus_s */
      readonly apply_action: string;
      /** @glyphName plus */
      readonly add_action: string;
      /** @glyphName plus_s */
      readonly create_action: string;
      /** @glyphName plus_o */
      readonly insert_action: string;
      /** @glyphName arrow_down_s */
      readonly append_action: string;
      /** @glyphName pen_to_square_o */
      readonly edit_action: string;
      /** @glyphName copy_s */
      readonly clone_action: string;
      /** @glyphName xmark_s */
      readonly delete_action: string;
      /** @glyphName minus */
      readonly remove_action: string;
      /** @glyphName ban_o */
      readonly remove_all_action: string;
      /** @glyphName eraser_s */
      readonly clear_action: string;
      /** @glyphName trash_o */
      readonly trash_action: string;
      /** @glyphName xmark */
      readonly cancel_action: string;
      /** @glyphName rotate_s */
      readonly reset_action: string;
      /** @glyphName rotate_left_s */
      readonly undo_action: string;
      /** @glyphName recycle_o */
      readonly revert_action: string;
      /** @glyphName play */
      readonly run_action: string;
      /** @glyphName play_s */
      readonly execute_action: string;
      /** @glyphName asterisk_s */
      readonly generate_action: string;
      /** @glyphName chevrons_right_s */
      readonly rebase_action: string;
      /** @glyphName rotate_right_s */
      readonly rotate_action: string;
      /** @glyphName layer_group_s */
      readonly new_layout_action: string;
      /** @glyphName bullseye_o */
      readonly follow_action: string;
      /** @glyphName plus_small_s */
      readonly allocate_action: string;
      /** @glyphName check_s */
      readonly select_all_action: string;
      /** @glyphName xmark_small_s */
      readonly unselect_all_action: string;
      /** @glyphName folder_s */
      readonly add_to_basket_action: string;
      /** @glyphName trash_s */
      readonly clean_basket_action: string;
      /** @glyphName lock_s */
      readonly change_password_action: string;
      /** @glyphName power_off_s */
      readonly logout_action: string;

      // =================================================================
      // VIEWS
      // =================================================================

      /** @glyphName eye_o */
      readonly preview_view: string;
      /** @glyphName rectangle_s */
      readonly card_view: string;
      /** @glyphName file_o */
      readonly json_view: string;
      /** @glyphName cog_s */
      readonly config_view: string;
      /** @glyphName database_s */
      readonly confdb_view: string;
      /** @glyphName layer_group_s */
      readonly mapping_view: string;
      /** @glyphName cog_o */
      readonly effective_settings_view: string;
      /** @glyphName wrench_s */
      readonly tools_view: string;
      /** @glyphName cog */
      readonly settings_view: string;
      /** @glyphName map_s */
      readonly map_view: string;
      /** @glyphName sitemap_s */
      readonly topology_view: string;
      /** @glyphName house_s */
      readonly dashboard_view: string;
      /** @glyphName comment_s */
      readonly console_view: string;
      /** @glyphName file_s */
      readonly scripts_view: string;
      /** @glyphName wifi_s */
      readonly interfaces_view: string;
      /** @glyphName bolt_s */
      readonly sensors_view: string;
      /** @glyphName fiber_optics_o */
      readonly links_view: string;
      /** @glyphName bullseye_o */
      readonly discovery_view: string;
      /** @glyphName burst_s */
      readonly alarms_view: string;
      /** @glyphName warehouse_s */
      readonly inventory_view: string;
      /** @glyphName newspaper_s */
      readonly command_log_view: string;
      /** @glyphName bars_s */
      readonly list_view: string;
      /** @glyphName rectangle_small_s */
      readonly grid_view: string;
      /** @glyphName stairs_o */
      readonly tree_view: string;
      /** @glyphName circle_notch_o */
      readonly chart_view: string;
      /** @glyphName globe */
      readonly globe_view: string;
      /** @glyphName filter_s */
      readonly toggle_filter_view: string;
      /** @glyphName folder_s */
      readonly toggle_basket_view: string;
      /** @glyphName compress_o */
      readonly toggle_fullscreen_view: string;
      /** @glyphName tv_s */
      readonly front_view: string;
      /** @glyphName tv_o */
      readonly rear_view: string;
      /** @glyphName ellipsis_s */
      readonly toggle_name_ip_view: string;
      /** @glyphName question */
      readonly help_view: string;
      /** @glyphName copyright */
      readonly about_view: string;
      /** @glyphName user_s */
      readonly user_profile_view: string;

      // =================================================================
      // DATA
      // =================================================================

      /** @glyphName rotate_s */
      readonly refresh_data: string;
      /** @glyphName spinner_s */
      readonly reload_data: string;
      /** @glyphName magnifying_glass_o */
      readonly search_data: string;
      /** @glyphName filter_s */
      readonly search_advanced_data: string;
      /** @glyphName filter_o */
      readonly query_data: string;

      // =================================================================
      // I/O
      // =================================================================

      /** @glyphName arrow_down_s */
      readonly export_io: string;
      /** @glyphName arrow_up_s */
      readonly import_io: string;
      /** @glyphName download_s */
      readonly download_io: string;
      /** @glyphName upload_s */
      readonly upload_io: string;
      /** @glyphName newspaper_s */
      readonly print_io: string;
      /** @glyphName copy_s */
      readonly copy_io: string;

      // =================================================================
      // STATE
      // =================================================================

      /** @glyphName check */
      readonly success_state: string;
      /** @glyphName check_s */
      readonly success_circle_state: string;
      /** @glyphName xmark */
      readonly error_state: string;
      /** @glyphName xmark_s */
      readonly error_circle_state: string;
      /** @glyphName triangle_s */
      readonly warning_state: string;
      /** @glyphName circle_info_s */
      readonly info_state: string;
      /** @glyphName question */
      readonly question_state: string;
      /** @glyphName star_s */
      readonly favorite_state: string;
      /** @glyphName lock_s */
      readonly locked_state: string;
    };
    [key: string]: number | typeof NOC.glyph.semantic;
  };
}

// eslint-disable-next-line no-var
declare var NOC: NOC;
